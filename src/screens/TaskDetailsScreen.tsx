import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetails'>;

type TaskData = {
    id: string;
    title: string;
    description: string;
    status: string;
    project: { name: string; project_admin: string };
    owner: { id: string; full_name: string };
    progress: number;
};

type TimeLog = {
    id: string;
    hours: number;
    message: string;
    created_at: string;
};

type Participant = {
    id: string;
    role: string;
    user: { full_name: string };
};

type UserOption = { id: string; full_name: string };

export default function TaskDetailsScreen({ route }: Props) {
    const { taskId } = route.params;
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [task, setTask] = useState<TaskData | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Auth & Permission state
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isProjectAdmin, setIsProjectAdmin] = useState(false);

    // Add Participant form state
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('contributor');
    const [adding, setAdding] = useState(false);

    // Log Hours state
    const [inputHours, setInputHours] = useState('');
    const [inputMessage, setInputMessage] = useState('');
    const [logging, setLogging] = useState(false);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
            const activeUser = user?.id;

            // Fetch Task Details
            const { data: taskData, error: taskErr } = await supabase
                .from('tasks')
                .select('*, project:projects(name, project_admin), owner:users!responsible_owner(id, full_name)')
                .eq('id', taskId)
                .single();

            if (taskData) {
                setTask(taskData as any);
                if (activeUser && taskData.project?.project_admin === activeUser) {
                    setIsProjectAdmin(true);
                }

                // Also check if current user's role is project_admin generally if they manage this project
            }

            // Fetch Participants
            const { data: parts, error: partsErr } = await supabase
                .from('participants')
                .select('id, role, user:users!user_id(full_name)')
                .eq('task_id', taskId);

            if (parts) {
                setParticipants(parts as any);
            }

            // If user is admin of this project, fetch users they can assign
            if (activeUser && taskData?.project?.project_admin === activeUser) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, full_name');
                if (usersData) setAvailableUsers(usersData);
            }

            // Fetch Time Logs for this task
            const { data: logs } = await supabase
                .from('time_logs')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (logs) {
                setTimeLogs(logs as TimeLog[]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Listen to changes in participants
        const channel = supabase
            .channel('public:participants:details')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'participants', filter: `task_id=eq.${taskId}` },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [taskId]);

    const handleAddParticipant = async () => {
        if (!selectedUser || !selectedRole) {
            Alert.alert('Error', 'Please select a user and a role.');
            return;
        }

        setAdding(true);
        try {
            const { error } = await supabase
                .from('participants')
                .insert({
                    task_id: taskId,
                    user_id: selectedUser,
                    role: selectedRole
                });

            if (error) throw error;
            Alert.alert('Success', 'Participant assigned.');
            setSelectedUser(''); // reset form
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not add participant.');
        } finally {
            setAdding(false);
        }
    };

    const handleAcceptTask = async () => {
        if (!currentUserId || !task) return;

        try {
            setLoading(true);
            // Update status
            const { error: updateError } = await supabase
                .from('tasks')
                .update({ status: 'in_sync' })
                .eq('id', taskId);

            if (updateError) throw updateError;

            // Create Sync Log
            const { error: logError } = await supabase
                .from('sync_logs')
                .insert({
                    task_id: taskId,
                    user_id: currentUserId,
                    status: 'accepted',
                    message: 'Task accepted and in sync via details screen',
                });

            if (logError) throw logError;

            Alert.alert('Success', `You have accepted: "${task.title}"`);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not accept task');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProgress = async (newProgress: number) => {
        if (!isProjectAdmin && currentUserId !== task?.owner?.id) return;
        try {
            let updates: any = { progress: newProgress };

            // Sync status with progress
            if (newProgress === 100) {
                updates.status = 'completed';
            } else if (newProgress === 0) {
                updates.status = 'pending';
            } else {
                // If progress is > 0 and < 100, set to in_sync
                updates.status = 'in_sync';
            }

            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', taskId);

            if (error) throw error;

            // Log the change if status changed
            if (updates.status && updates.status !== task?.status) {
                await supabase.from('sync_logs').insert({
                    task_id: taskId,
                    user_id: currentUserId,
                    status: updates.status,
                    message: `${isProjectAdmin ? 'Admin' : 'Owner'} updated progress to ${newProgress}% and status to ${updates.status}`,
                });
            }

            Alert.alert('Success', `Progress updated to ${newProgress}%${updates.status ? ' and status to ' + updates.status : ''}`);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not update progress');
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!currentUserId || !task) return;
        // Allow if user is owner OR project admin
        if (currentUserId !== task.owner?.id && !isProjectAdmin) return;

        try {
            setLoading(true);
            // Update status
            const { error: updateError } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (updateError) throw updateError;

            // Create Sync Log
            const logMessages: Record<string, string> = {
                'in_sync': 'Task set to In Sync',
                'blocked': 'Task marked as Blocked',
                'help_requested': 'Help requested for this task',
                'pending': 'Task moved back to Pending status',
                'completed': 'Task marked as Completed'
            };

            const { error: logError } = await supabase
                .from('sync_logs')
                .insert({
                    task_id: taskId,
                    user_id: currentUserId,
                    status: newStatus,
                    message: logMessages[newStatus] || `Status updated to ${newStatus}`,
                });

            if (logError) throw logError;

            Alert.alert('Success', `Task status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not update status');
        } finally {
            setLoading(false);
        }
    };

    const handleLogHours = async () => {
        if (!inputHours || isNaN(Number(inputHours))) {
            Alert.alert('Error', 'Please enter a valid number of hours.');
            return;
        }

        if (!currentUserId) return;

        setLogging(true);
        try {
            const { error } = await supabase
                .from('time_logs')
                .insert({
                    task_id: taskId,
                    user_id: currentUserId,
                    hours: Number(inputHours),
                    message: inputMessage || 'Work on task'
                });

            if (error) throw error;

            Alert.alert('Success', 'Hours logged successfully!');
            setInputHours('');
            setInputMessage('');
            fetchData(); // Refresh logs and indirectly stats
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not log hours');
        } finally {
            setLogging(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    if (!task) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text>Task not found.</Text>
            </View>
        );
    }

    // A generic random image for team members based on their id
    const getRandomAvatar = (userId: string) => {
        const lastChar = userId.charCodeAt(userId.length - 1) || 0;
        const index = (lastChar % 50) + 1; // 1 to 50
        return `https://i.pravatar.cc/150?img=${index}`;
    };

    const renderParticipant = ({ item }: { item: Participant }) => (
        <View style={styles.participantRow}>
            <Image source={{ uri: getRandomAvatar(item.id) }} style={styles.participantAvatar} />
            <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{item.user?.full_name || 'Unknown'}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Task Info Area */}
                <View style={styles.taskInfoCard}>
                    <View style={styles.taskHeaderRow}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={[
                            styles.statusBadge,
                            task.status === 'in_sync' && styles.statusBadgeSync,
                            task.status === 'blocked' && styles.statusBadgeBlocked,
                            task.status === 'help_requested' && styles.statusBadgeHelp,
                            task.status === 'pending' && styles.statusBadgePending,
                            task.status === 'completed' && styles.statusBadgeCompleted,
                        ]}>
                            <Text style={[
                                styles.statusText,
                                task.status === 'in_sync' && styles.statusTextSync,
                                task.status === 'blocked' && styles.statusTextBlocked,
                                task.status === 'help_requested' && styles.statusTextHelp,
                                task.status === 'pending' && styles.statusTextPending,
                                task.status === 'completed' && styles.statusTextCompleted,
                            ]}>
                                {task.status.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="folder-outline" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>Project: {task.project?.name || 'Unknown'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>Responsible: {task.owner?.full_name || 'Unknown'}</Text>
                    </View>

                    <Text style={styles.sectionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>{task.description || 'No description provided.'}</Text>
                </View>

                {/* Team Members List */}
                <Text style={styles.sectionHeadingStandard}>Participants</Text>
                {participants.length === 0 ? (
                    <Text style={styles.emptyText}>No matching participants added yet.</Text>
                ) : (
                    <View style={styles.participantsCard}>
                        {participants.map((p, index) => (
                            <View key={p.id}>
                                {renderParticipant({ item: p })}
                                {index < participants.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                )}

                {/* Add Participant Form (Project Admin Only) */}
                {isProjectAdmin && (
                    <View style={styles.addParticipantManager}>
                        <Text style={styles.sectionHeadingStandard}>Assign Participant</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Select User</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedUser}
                                    onValueChange={setSelectedUser}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Choose user..." value="" color="#9CA3AF" />
                                    {availableUsers.map(u => (
                                        <Picker.Item key={u.id} label={u.full_name || 'No Name'} value={u.id} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Select Role</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedRole}
                                    onValueChange={setSelectedRole}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Contributor" value="contributor" />
                                    <Picker.Item label="Helper" value="helper" />
                                    <Picker.Item label="Reviewer" value="reviewer" />
                                </Picker>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.addButton, adding && styles.buttonDisabled]}
                            onPress={handleAddParticipant}
                            disabled={adding}
                        >
                            {adding ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="person-add" size={18} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Participant</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Responsible Owner or Admin Action: Update Status */}
                {(currentUserId === task.owner?.id || isProjectAdmin) && (
                    <View style={styles.actionContainer}>
                        <Text style={styles.sectionHeadingStandardSmall}>Update Task Status</Text>

                        {task.status === 'pending' ? (
                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={handleAcceptTask}
                            >
                                <Ionicons name="checkmark-done-circle-outline" size={24} color="#FFF" />
                                <Text style={styles.acceptButtonText}>Accept Task</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: '100%' }}>
                                <View style={styles.statusButtonRow}>
                                    <TouchableOpacity
                                        style={[styles.statusToggleBtn, task.status === 'pending' && styles.statusToggleBtnActivePending]}
                                        onPress={() => handleUpdateStatus('pending')}
                                    >
                                        <Ionicons name="time-outline" size={20} color={task.status === 'pending' ? '#FFF' : '#6366F1'} />
                                        <Text style={[styles.statusToggleText, task.status === 'pending' && styles.statusToggleTextActive]}>Pending</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.statusToggleBtn, task.status === 'in_sync' && styles.statusToggleBtnActiveSync]}
                                        onPress={() => handleUpdateStatus('in_sync')}
                                    >
                                        <Ionicons name="sync-outline" size={20} color={task.status === 'in_sync' ? '#FFF' : '#16A34A'} />
                                        <Text style={[styles.statusToggleText, task.status === 'in_sync' && styles.statusToggleTextActive]}>In Sync</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.statusButtonRow}>
                                    <TouchableOpacity
                                        style={[styles.statusToggleBtn, task.status === 'blocked' && styles.statusToggleBtnActiveBlocked]}
                                        onPress={() => handleUpdateStatus('blocked')}
                                    >
                                        <Ionicons name="ban-outline" size={20} color={task.status === 'blocked' ? '#FFF' : '#DC2626'} />
                                        <Text style={[styles.statusToggleText, task.status === 'blocked' && styles.statusToggleTextActive]}>Blocked</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.statusToggleBtn, task.status === 'help_requested' && styles.statusToggleBtnActiveHelp]}
                                        onPress={() => handleUpdateStatus('help_requested')}
                                    >
                                        <Ionicons name="help-circle-outline" size={20} color={task.status === 'help_requested' ? '#FFF' : '#EAB308'} />
                                        <Text style={[styles.statusToggleText, task.status === 'help_requested' && styles.statusToggleTextActive]}>Help</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.statusToggleBtn, { marginTop: 12, width: '100%' }, task.status === 'completed' && styles.statusToggleBtnActiveCompleted]}
                                    onPress={() => handleUpdateStatus('completed')}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={20} color={task.status === 'completed' ? '#FFF' : '#10B981'} />
                                    <Text style={[styles.statusToggleText, task.status === 'completed' && styles.statusToggleTextActive]}>Mark as Completed</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.actionNote}>
                            {task.status === 'pending'
                                ? 'Accepting this task will change its status to "In Sync" and notify the project admin.'
                                : 'Update your current work status. Each change will be logged for transparency.'}
                        </Text>
                    </View>
                )}

                {/* Log Hours (Task Owner or Admin) */}
                {(isProjectAdmin || currentUserId === task.owner?.id) && (
                    <View style={styles.logHoursCard}>
                        <Text style={styles.sectionHeadingStandard}>Log Hours</Text>
                        <View style={styles.logInputRow}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                <Text style={styles.label}>Hours</Text>
                                <View style={styles.pickerContainer}>
                                    <View style={{ paddingHorizontal: 16, height: 50, justifyContent: 'center' }}>
                                        <TextInput
                                            placeholder="e.g. 2.5"
                                            value={inputHours}
                                            onChangeText={setInputHours}
                                            keyboardType="decimal-pad"
                                            style={{ color: '#1F2937', fontSize: 16 }}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>What did you work on?</Text>
                            <View style={[styles.pickerContainer, { height: 80, padding: 12 }]}>
                                <TextInput
                                    placeholder="Brief description of work..."
                                    value={inputMessage}
                                    onChangeText={setInputMessage}
                                    multiline
                                    style={{ color: '#1F2937', fontSize: 14, height: '100%' }}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.logButton, logging && styles.buttonDisabled]}
                            onPress={handleLogHours}
                            disabled={logging}
                        >
                            {logging ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="time-outline" size={20} color="#FFF" />
                                    <Text style={styles.logButtonText}>Log Hours</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Time Logs List */}
                <Text style={styles.sectionHeadingStandard}>Time Logs</Text>
                {timeLogs.length === 0 ? (
                    <Text style={styles.emptyText}>No hours logged for this task yet.</Text>
                ) : (
                    <View style={styles.logsContainer}>
                        {timeLogs.map((log, index) => (
                            <View key={log.id} style={styles.logCard}>
                                <View style={styles.logHeader}>
                                    <View style={styles.logHoursBadge}>
                                        <Text style={styles.logHoursText}>{log.hours}h</Text>
                                    </View>
                                    <Text style={styles.logDate}>
                                        {new Date(log.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={styles.logMessage}>{log.message}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Progress Update (Admin or Owner) */}
                {(isProjectAdmin || currentUserId === task.owner?.id) && (task.status === 'in_sync' || task.status === 'blocked' || task.status === 'help_requested') && (
                    <View style={styles.adminActionCard}>
                        <Text style={styles.sectionHeadingStandard}>Update Progress</Text>
                        <View style={styles.progressUpdateRow}>
                            <TouchableOpacity
                                style={styles.progressBtn}
                                onPress={() => handleUpdateProgress(Math.max(0, (task.progress || 0) - 10))}
                            >
                                <Ionicons name="remove-circle-outline" size={32} color="#EA580C" />
                            </TouchableOpacity>

                            <View style={styles.progressDisplay}>
                                <Text style={styles.progressPercentText}>{task.progress || 0}%</Text>
                                <Text style={styles.progressStatusTextLabel}>COMPLETED</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.progressBtn}
                                onPress={() => handleUpdateProgress(Math.min(100, (task.progress || 0) + 10))}
                            >
                                <Ionicons name="add-circle-outline" size={32} color="#EA580C" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.quickSelectRow}>
                            {[0, 25, 50, 75, 100].map(val => (
                                <TouchableOpacity
                                    key={val}
                                    style={[styles.quickBtn, task.progress === val && styles.quickBtnActive]}
                                    onPress={() => handleUpdateProgress(val)}
                                >
                                    <Text style={[styles.quickBtnText, task.progress === val && styles.quickBtnTextActive]}>{val}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    scrollContent: { padding: 20, paddingBottom: 60 },

    // Task Info 
    taskInfoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    taskHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
    },
    statusBadgeSync: { backgroundColor: '#DCFCE7' },
    statusBadgeBlocked: { backgroundColor: '#FEE2E2' },
    statusBadgeHelp: { backgroundColor: '#FEF9C3' },
    statusBadgePending: { backgroundColor: '#EEF2FF' },
    statusBadgeCompleted: { backgroundColor: '#F3F4F6' },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6B7280',
    },
    statusTextSync: { color: '#16A34A' },
    statusTextBlocked: { color: '#DC2626' },
    statusTextHelp: { color: '#CA8A04' },
    statusTextPending: { color: '#6366F1' },
    statusTextCompleted: { color: '#9CA3AF' },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    sectionHeadingStandard: {
        fontSize: 16,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 12,
        marginLeft: 4,
    },
    descriptionText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 22,
    },

    // Participants List
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginLeft: 4,
        marginBottom: 24,
    },
    participantsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    participantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        marginRight: 12,
    },
    participantInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    participantName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    roleBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },

    // Add Participant form
    addParticipantManager: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
    pickerContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        overflow: 'hidden',
    },
    picker: { height: 50, width: '100%' },
    addButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginTop: 8,
        gap: 8,
    },
    buttonDisabled: { opacity: 0.7 },
    addButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    // Accept Task styles
    actionContainer: {
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    acceptButton: {
        backgroundColor: '#16A34A',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        width: '100%',
        gap: 12,
        marginBottom: 12,
    },
    acceptButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
    actionNote: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 18,
    },
    // Admin Progress 
    adminActionCard: {
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    progressUpdateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    progressBtn: { padding: 4 },
    progressDisplay: { alignItems: 'center' },
    progressPercentText: { fontSize: 32, fontWeight: '800', color: '#111827' },
    progressStatusTextLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
    quickSelectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    quickBtn: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    quickBtnActive: { backgroundColor: '#EA580C' },
    quickBtnText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
    quickBtnTextActive: { color: '#FFF' },
    sectionHeadingStandardSmall: {
        fontSize: 14,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    statusButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
        marginBottom: 16,
    },
    statusToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    statusToggleBtnActiveSync: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },
    statusToggleBtnActiveBlocked: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626',
    },
    statusToggleBtnActiveHelp: {
        backgroundColor: '#EAB308',
        borderColor: '#EAB308',
    },
    statusToggleBtnActivePending: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    statusToggleBtnActiveCompleted: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    statusToggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    statusToggleTextActive: {
        color: '#FFF',
    },
    logHoursCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    logInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logButton: {
        backgroundColor: '#EA580C',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginTop: 8,
        gap: 8,
    },
    logButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    logsContainer: {
        marginBottom: 40,
    },
    logCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    logHoursBadge: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    logHoursText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#EA580C',
    },
    logDate: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    logMessage: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
});
