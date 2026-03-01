import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type PendingProject = {
    id: string;
    name: string;
    description: string;
    created_by: string;
};

export default function ProjectAdminPendingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [projects, setProjects] = useState<PendingProject[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingProjects = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('projects')
                .select('id, name, description, created_by')
                .eq('project_admin', user.id)
                .eq('admin_accepted', false);

            if (data) {
                setProjects(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProjects();
    }, []);

    const handleAccept = async (projectId: string, createdBy: string, projectName: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch current user details for the notification
            const { data: currentUserData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const adminName = currentUserData?.full_name || 'An admin';

            // 1. Update project status
            const { error: updateError } = await supabase
                .from('projects')
                .update({ admin_accepted: true })
                .eq('id', projectId);

            if (updateError) throw updateError;

            // 2. Notify the super admin
            await supabase.from('notifications').insert({
                user_id: createdBy, // the super admin who created it
                title: 'Project Admin Accepted',
                message: `${adminName} has accepted the assignment for project "${projectName}".`,
            });

            // 3. Mark the project assignment notification as read (optional cleanup)
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .like('message', `%${projectName}%`);

            Alert.alert('Success', `You are now the admin of ${projectName}.`);
            fetchPendingProjects();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const renderItem = ({ item }: { item: PendingProject }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="folder-open" size={24} color="#3B82F6" />
                <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
            <Text style={styles.cardDescription}>{item.description || 'No description provided.'}</Text>
            <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAccept(item.id, item.created_by, item.name)}
            >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                <Text style={styles.acceptButtonText}>Accept Project</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Assignments</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : projects.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>You have no pending project assignments.</Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.listContainer}
                    data={projects}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#6B7280', textAlign: 'center' },
    listContainer: { padding: 20 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginLeft: 10, flex: 1 },
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
