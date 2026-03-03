import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

type Participant = {
    id: string;
    role: string;
    user: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
};

type Task = {
    id: string;
    title: string;
    status: string;
    progress: number;
    responsible_owner: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    participants: Participant[];
};

type Project = {
    id: string;
    name: string;
};

export default function TreeScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchTasks(selectedProjectId);
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .order('name');

            if (data && data.length > 0) {
                setProjects(data);
                setSelectedProjectId(data[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setLoading(false);
        }
    };

    const fetchTasks = async (projectId: string) => {
        try {
            setLoading(true);
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('id, title, status, progress, responsible_owner:users!responsible_owner(id, full_name, avatar_url)')
                .eq('project_id', projectId);

            if (tasksError) throw tasksError;

            const taskIds = (tasksData || []).map(t => t.id);
            if (taskIds.length === 0) {
                setTasks([]);
                return;
            }

            const { data: participantsData, error: partsError } = await supabase
                .from('participants')
                .select('id, task_id, role, user:users!user_id(id, full_name, avatar_url)')
                .in('task_id', taskIds);

            if (partsError) throw partsError;

            const tasksWithParticipants = tasksData.map(task => ({
                ...task,
                participants: (participantsData || []).filter(p => p.task_id === task.id)
            }));

            setTasks(tasksWithParticipants as any);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleExpand = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    const getFallbackAvatar = (fullName: string) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=EA580C&color=fff&size=200`;
    };

    const renderProjectPicker = () => (
        <View style={styles.projectPickerContainer}>
            <FlatList
                horizontal
                data={projects}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.projectPickerContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.projectBadge,
                            selectedProjectId === item.id && styles.projectBadgeActive
                        ]}
                        onPress={() => setSelectedProjectId(item.id)}
                    >
                        <Text style={[
                            styles.projectBadgeText,
                            selectedProjectId === item.id && styles.projectBadgeTextActive
                        ]}>
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    const renderTask = ({ item }: { item: Task }) => {
        const isExpanded = expandedTasks.has(item.id);

        // Group participants by role
        const grouped = (item.participants || []).reduce((acc: any, p) => {
            const role = p.role.toLowerCase();
            if (!acc[role]) acc[role] = [];
            acc[role].push(p);
            return acc;
        }, {});

        return (
            <View style={styles.taskCard}>
                <TouchableOpacity
                    style={styles.taskHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.taskTitleRow}>
                        <View style={[
                            styles.statusIndicator,
                            { backgroundColor: getStatusColor(item.status) }
                        ]} />
                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#94A3B8"
                        />
                    </View>
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                                {item.status.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.progressText}>{item.progress}% Complete</Text>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.divider} />

                        {/* Responsible Owner */}
                        <Text style={styles.sectionTitle}>RESPONSIBLE OWNER</Text>
                        <View style={styles.memberRow}>
                            <Image
                                source={{ uri: item.responsible_owner?.avatar_url || getFallbackAvatar(item.responsible_owner?.full_name || 'Owner') }}
                                style={styles.avatar}
                            />
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{item.responsible_owner?.full_name || 'Unassigned'}</Text>
                                <Text style={styles.memberRole}>Lead Developer</Text>
                            </View>
                            <View style={[styles.roleBadge, { backgroundColor: '#F0FDF4' }]}>
                                <Text style={[styles.roleBadgeText, { color: '#16A34A' }]}>OWNER</Text>
                            </View>
                        </View>

                        {/* Grouped Participants */}
                        {Object.keys(grouped).map(role => (
                            <View key={role} style={styles.roleSection}>
                                <Text style={styles.sectionTitle}>{role.toUpperCase()}S</Text>
                                {grouped[role].map((p: Participant) => (
                                    <View key={p.id} style={styles.memberRow}>
                                        <Image
                                            source={{ uri: p.user?.avatar_url || getFallbackAvatar(p.user?.full_name || 'User') }}
                                            style={styles.avatar}
                                        />
                                        <View style={styles.memberInfo}>
                                            <Text style={styles.memberName}>{p.user?.full_name}</Text>
                                            <Text style={styles.memberRole}>Team Member</Text>
                                        </View>
                                        <View style={[styles.roleBadge, { backgroundColor: getRoleBg(role) }]}>
                                            <Text style={[styles.roleBadgeText, { color: getRoleColor(role) }]}>{role.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}

                        {item.participants.length === 0 && (
                            <Text style={styles.emptyParticipants}>No other participants assigned.</Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'in_sync': return '#6366F1';
            case 'blocked': return '#EF4444';
            case 'help_requested': return '#F59E0B';
            default: return '#94A3B8';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'completed': return '#D1FAE5';
            case 'in_sync': return '#E0E7FF';
            case 'blocked': return '#FEE2E2';
            case 'help_requested': return '#FEF3C7';
            default: return '#F1F5F9';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'contributor': return '#6366F1';
            case 'helper': return '#F59E0B';
            case 'reviewer': return '#8B5CF6';
            default: return '#64748B';
        }
    };

    const getRoleBg = (role: string) => {
        switch (role) {
            case 'contributor': return '#EEF2FF';
            case 'helper': return '#FFFBEB';
            case 'reviewer': return '#F5F3FF';
            default: return '#F8FAFC';
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Tree View</Text>
                <TouchableOpacity onPress={() => selectedProjectId && fetchTasks(selectedProjectId)}>
                    <Ionicons name="refresh" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {renderProjectPicker()}

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTask}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={() => selectedProjectId && fetchTasks(selectedProjectId)}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="list-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No tasks found for this project.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    projectPickerContainer: {
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    projectPickerContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    projectBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    projectBadgeActive: {
        backgroundColor: '#EA580C',
        borderColor: '#EA580C',
    },
    projectBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    projectBadgeTextActive: {
        color: '#FFF',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    taskCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
        overflow: 'hidden',
    },
    taskHeader: {
        padding: 16,
    },
    taskTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    taskTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    progressText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
    },
    memberInfo: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    memberRole: {
        fontSize: 11,
        color: '#94A3B8',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    roleBadgeText: {
        fontSize: 9,
        fontWeight: '800',
    },
    roleSection: {
        marginTop: 8,
    },
    emptyParticipants: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
        marginTop: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
});
