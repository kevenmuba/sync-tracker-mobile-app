import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Image as SvgImage, Text as SvgText } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

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

export default function StatsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

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
        }
    };

    const getRandomAvatar = (userId: string) => {
        const lastChar = userId.charCodeAt(userId.length - 1) || 0;
        const index = (lastChar % 50) + 1;
        return `https://i.pravatar.cc/150?img=${index}`;
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

    const renderTaskNode = ({ item, index }: { item: Task, index: number }) => {
        const centerX = screenWidth / 2 - 20; // Correct for padding
        const nodeRadius = 25;
        const ownerY = 100;
        const baseParticipantY = 200;
        const participantSpacingY = 80;

        const participants = item.participants || [];
        const svgHeight = baseParticipantY + (participants.length * participantSpacingY);

        return (
            <View style={styles.graphCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.taskLabel}>TASK {index + 1}</Text>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                </View>

                <Svg height={svgHeight} width={screenWidth - 40}>
                    {/* Line from Task to Owner */}
                    <Line
                        x1={centerX} y1={nodeRadius + 20}
                        x2={centerX} y2={ownerY - nodeRadius}
                        stroke="#E2E8F0" strokeWidth="2" strokeDasharray="5,5"
                    />

                    {/* Task Node */}
                    <Circle cx={centerX} cy={nodeRadius + 20} r={nodeRadius} fill={getStatusColor(item.status)} />
                    <SvgText
                        x={centerX} y={nodeRadius + 25}
                        fill="white" fontSize="10" fontWeight="bold" textAnchor="middle"
                    >
                        TASK
                    </SvgText>

                    {/* Owner Node */}
                    <G transform={`translate(${centerX - nodeRadius}, ${ownerY - nodeRadius})`}>
                        <Circle cx={nodeRadius} cy={nodeRadius} r={nodeRadius} fill="#111827" />
                        <SvgImage
                            href={item.responsible_owner?.avatar_url || getRandomAvatar(item.responsible_owner?.id || 'owner')}
                            x="5" y="5" width="40" height="40"
                            clipPath="circle(20)"
                        />
                    </G>
                    <SvgText
                        x={centerX} y={ownerY + 40}
                        fill="#1F2937" fontSize="12" fontWeight="bold" textAnchor="middle"
                    >
                        {item.responsible_owner?.full_name?.split(' ')[0]}
                    </SvgText>
                    <SvgText
                        x={centerX} y={ownerY + 52}
                        fill="#94A3B8" fontSize="10" textAnchor="middle"
                    >
                        OWNER
                    </SvgText>

                    {/* Participants */}
                    {participants.length > 0 && (
                        <Line
                            x1={centerX} y1={ownerY + nodeRadius + 30}
                            x2={centerX} y2={baseParticipantY - nodeRadius}
                            stroke="#E2E8F0" strokeWidth="2"
                        />
                    )}

                    {participants.map((p, pIndex) => {
                        const pY = baseParticipantY + (pIndex * participantSpacingY);
                        const isEven = pIndex % 2 === 0;
                        const pX = isEven ? centerX - 80 : centerX + 80;

                        return (
                            <G key={p.id}>
                                {/* Connection Line */}
                                <Line
                                    x1={centerX} y1={pY}
                                    x2={pX} y2={pY}
                                    stroke="#E2E8F0" strokeWidth="2"
                                />
                                {pIndex < participants.length - 1 && (
                                    <Line
                                        x1={centerX} y1={pY}
                                        x2={centerX} y2={pY + participantSpacingY}
                                        stroke="#E2E8F0" strokeWidth="2"
                                    />
                                )}

                                {/* Participant Node */}
                                <G transform={`translate(${pX - 20}, ${pY - 20})`}>
                                    <Circle cx="20" cy="20" r="20" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
                                    <SvgImage
                                        href={p.user?.avatar_url || getRandomAvatar(p.user?.id || 'part')}
                                        x="5" y="5" width="30" height="30"
                                        clipPath="circle(15)"
                                    />
                                </G>
                                <SvgText
                                    x={pX} y={pY + 35}
                                    fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle"
                                >
                                    {p.user?.full_name?.split(' ')[0]}
                                </SvgText>
                            </G>
                        );
                    })}
                </Svg>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Visual Stats</Text>
                <TouchableOpacity onPress={() => selectedProjectId && fetchTasks(selectedProjectId)} style={styles.navBtn}>
                    <Ionicons name="refresh" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Project Selector Badge List */}
            <View style={styles.projectList}>
                <FlatList
                    horizontal
                    data={projects}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.badge, selectedProjectId === item.id && styles.badgeActive]}
                            onPress={() => setSelectedProjectId(item.id)}
                        >
                            <Text style={[styles.badgeText, selectedProjectId === item.id && styles.badgeTextActive]}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <View style={[styles.container, styles.center]}>
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={item => item.id}
                    renderItem={renderTaskNode}
                    contentContainerStyle={styles.scrollList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <Ionicons name="analytics" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No data available for this project</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
        backgroundColor: '#FFF',
    },
    navBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
    projectList: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    badgeActive: { backgroundColor: '#111827', borderColor: '#111827' },
    badgeText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    badgeTextActive: { color: '#FFF' },
    scrollList: { padding: 20 },
    graphCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: { marginBottom: 20, alignItems: 'center' },
    taskLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 2 },
    taskTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 4, textAlign: 'center' },
    emptyView: { marginTop: 100, alignItems: 'center' },
    emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 15, fontWeight: '500' },
});
