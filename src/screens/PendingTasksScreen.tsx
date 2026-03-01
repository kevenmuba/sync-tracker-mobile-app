import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type PendingTask = {
    id: string;
    title: string;
    description: string;
    project: { name: string };
};

export default function PendingTasksScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [tasks, setTasks] = useState<PendingTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchPendingTasks = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data, error } = await supabase
                .from('tasks')
                .select('id, title, description, project:projects(name)')
                .eq('responsible_owner', user.id)
                .eq('status', 'pending');

            if (data) {
                setTasks(data as any);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTasks();

        // Realtime updates
        const channel = supabase
            .channel('public:tasks:pending')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tasks' },
                () => {
                    fetchPendingTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAcceptTask = async (taskId: string, taskTitle: string) => {
        if (!userId) return;

        try {
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
                    user_id: userId,
                    status: 'accepted',
                    message: 'Task accepted and in sync',
                });

            if (logError) throw logError;

            Alert.alert('Success', `You have accepted: "${taskTitle}"`);
            fetchPendingTasks();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not accept task');
        }
    };

    const renderTaskLabel = ({ item }: { item: PendingTask }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={24} color="#EA580C" />
                <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardProject}>Project: {item.project?.name || 'Unknown'}</Text>
            <Text style={styles.cardDescription}>{item.description || 'No description provided.'}</Text>

            <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptTask(item.id, item.title)}
            >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                <Text style={styles.acceptButtonText}>Accept Task</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Tasks</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : tasks.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>You have no pending tasks.</Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.listContainer}
                    data={tasks}
                    keyExtractor={item => item.id}
                    renderItem={renderTaskLabel}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#6B7280', textAlign: 'center' },
    listContainer: { padding: 20, gap: 16 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginLeft: 10, flex: 1 },
    cardProject: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
    cardDescription: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
    acceptButton: {
        backgroundColor: '#16A34A',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    acceptButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
