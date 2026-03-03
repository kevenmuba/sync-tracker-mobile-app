import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [userName, setUserName] = useState('');
    const [loadingUser, setLoadingUser] = useState(true);
    const [projectCount, setProjectCount] = useState<number | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [totalTasks, setTotalTasks] = useState(0);
    const [inSyncCount, setInSyncCount] = useState(0);
    const [blockedCount, setBlockedCount] = useState(0);
    const [activeTasks, setActiveTasks] = useState<any[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=EA580C&color=fff&size=200`;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Fetch from public.users table instead of auth metadata
                    const { data: publicUser } = await supabase
                        .from('users')
                        .select('full_name, avatar_url')
                        .eq('id', user.id)
                        .single();

                    if (publicUser?.full_name) {
                        setUserName(publicUser.full_name.split(' ')[0]);
                    } else {
                        // Fallback to email
                        setUserName(user.email?.split('@')[0] || 'there');
                    }

                    if (publicUser?.avatar_url) {
                        setUserAvatar(publicUser.avatar_url);
                    }
                }
            } catch (e) {
                setUserName('there');
            } finally {
                setLoadingUser(false);
            }
        };
        const fetchCounts = async () => {
            try {
                const { count, error } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true });
                if (!error && count !== null) {
                    setProjectCount(count);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);
                if (count !== null) {
                    setUnreadCount(count);
                }

                // REALTIME WATCHER FOR NEW UNREAD NOTIFICATIONS
                const channel = supabase
                    .channel('public:notifications:badge')
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                        () => {
                            setUnreadCount((prev) => prev + 1);
                        }
                    )
                    .subscribe();
            }
        };

        const fetchTasksData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Pending Tasks
                const { count: pending } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('responsible_owner', user.id)
                    .eq('status', 'pending');
                setPendingCount(pending || 0);

                // Total Tasks
                const { count: total } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true });
                setTotalTasks(total || 0);

                // In Sync Tasks
                const { count: insync } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'in_sync');
                setInSyncCount(insync || 0);

                // Blocked Tasks
                const { count: blocked } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'blocked');
                setBlockedCount(blocked || 0);

                // Active Tasks List (where status is not completed)
                setLoadingTasks(true);
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('*, projects(name)')
                    .eq('responsible_owner', user.id)
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (tasks) {
                    setActiveTasks(tasks);
                }
                setLoadingTasks(false);
            }
        };

        fetchUser();
        fetchCounts();
        fetchNotifications();
        fetchTasksData();
    }, []);

    const renderSummaryCard = (
        iconName: any,
        iconColor: string,
        iconBgColor: string,
        count: string,
        label: string,
        onPress?: () => void
    ) => (
        <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.7}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
            <Text style={styles.summaryCount}>{count}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const renderTaskCard = (
        title: string,
        project: string,
        progress: number,
        statusLabel: string,
        statusType: 'success' | 'warning' | 'error'
    ) => {
        let badgeColor = '';
        let badgeBgColor = '';
        let progressColor = '';

        if (statusType === 'success') {
            badgeColor = '#22C55E';
            badgeBgColor = '#DCFCE7';
            progressColor = '#EA580C'; // matches mockup primary orange
        } else if (statusType === 'warning') {
            badgeColor = '#EAB308';
            badgeBgColor = '#FEF9C3';
            progressColor = '#EAB308';
        } else if (statusType === 'error') {
            badgeColor = '#EF4444';
            badgeBgColor = '#FEE2E2';
            progressColor = '#EF4444';
        }

        return (
            <View style={styles.taskCard}>
                <View style={styles.taskHeader}>
                    <View>
                        <Text style={styles.taskTitle}>{title}</Text>
                        <Text style={styles.taskProject}>Project: {project}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>
                            {statusLabel}
                        </Text>
                    </View>
                </View>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>{progress}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${progress}%`, backgroundColor: progressColor },
                        ]}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header Profile Section */}
                <View style={styles.header}>
                    <View style={styles.profileInfo}>
                        <Image
                            source={{ uri: userAvatar || defaultAvatar }}
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={styles.greetingHeader}>Welcome back,</Text>
                            {loadingUser ? (
                                <ActivityIndicator size="small" color="#EA580C" style={{ marginTop: 4 }} />
                            ) : (
                                <Text style={styles.greetingName}>
                                    {getGreeting()}, {userName}
                                </Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => {
                            setUnreadCount(0);
                            navigation.navigate('NotificationsHistory');
                        }}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#1F2937" />
                        {unreadCount > 0 && (
                            <View style={styles.notificationDot}>
                                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                                    {unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUICK SUMMARY</Text>
                    <View style={styles.grid}>
                        {renderSummaryCard(
                            'folder-open-outline',
                            '#3B82F6',
                            '#EFF6FF',
                            projectCount !== null ? projectCount.toString() : '-',
                            'Total Projects',
                            () => navigation.navigate('Projects')
                        )}
                        {renderSummaryCard(
                            'time-outline',
                            '#EA580C',
                            '#FFEDD5',
                            pendingCount.toString(),
                            'Pending Tasks',
                            () => navigation.navigate('PendingTasks')
                        )}
                        {renderSummaryCard(
                            'clipboard-outline',
                            '#EF4444',
                            '#FEE2E2',
                            totalTasks.toString(),
                            'Total Tasks',
                            () => navigation.navigate('Tasks')
                        )}
                        {renderSummaryCard(
                            'checkmark-circle-outline',
                            '#22C55E',
                            '#DCFCE7',
                            inSyncCount.toString(),
                            'In Sync',
                            () => {
                                // Potentially navigate with filter In Sync
                                navigation.navigate('Tasks');
                            }
                        )}
                        {renderSummaryCard(
                            'ban-outline',
                            '#EF4444',
                            '#FEE2E2',
                            blockedCount.toString(),
                            'Blocked',
                            () => {
                                navigation.navigate('Tasks');
                            }
                        )}
                    </View>
                </View>

                {/* My Active Tasks Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitleActive}>My Active Tasks</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                            <Text style={styles.viewAllText}>View all</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingTasks ? (
                        <ActivityIndicator color="#EA580C" />
                    ) : activeTasks.length === 0 ? (
                        <Text style={styles.emptyText}>No active tasks found.</Text>
                    ) : (
                        activeTasks.map((task) => (
                            <TouchableOpacity
                                key={task.id}
                                onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                            >
                                {renderTaskCard(
                                    task.title,
                                    task.projects?.name || 'Unknown Project',
                                    task.progress || 0,
                                    task.status.replace('_', ' ').toUpperCase(),
                                    task.status === 'in_sync' ? 'success' : task.status === 'blocked' ? 'error' : 'warning'
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F9', // Light grayish-blue background
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: Platform.OS === 'android' ? 24 : 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#E5E7EB',
    },
    greetingHeader: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    greetingName: {
        fontSize: 18,
        color: '#111827',
        fontWeight: '800',
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    notificationDot: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#EA580C',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    sectionTitleActive: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#EA580C', // Orange theme
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryCount: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    taskCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    taskProject: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#9CA3AF',
    },
    progressValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 10,
    }
});
