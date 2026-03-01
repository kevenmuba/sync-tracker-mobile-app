import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function ProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [acceptedProjects, setAcceptedProjects] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    if (data) {
                        setRole(data.role);

                        if (data.role === 'project_admin') {
                            const { data: projects } = await supabase
                                .from('projects')
                                .select('id, name')
                                .eq('project_admin', user.id)
                                .eq('admin_accepted', true);

                            if (projects) setAcceptedProjects(projects);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Profile</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#EA580C" style={{ marginTop: 20 }} />
            ) : (
                <View style={styles.content}>
                    <Text style={styles.roleText}>Current Role: {role ? role.replace('_', ' ').toUpperCase() : 'UNKNOWN'}</Text>

                    {role === 'super_admin' && (
                        <TouchableOpacity
                            style={styles.adminButton}
                            onPress={() => navigation.navigate('CreateProject')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.adminButtonIcon}>
                                <Ionicons name="add-circle" size={24} color="#FFF" />
                            </View>
                            <Text style={styles.adminButtonText}>Create New Project</Text>
                            <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ opacity: 0.8 }} />
                        </TouchableOpacity>
                    )}

                    {role === 'project_admin' && (
                        <View style={styles.projectsSection}>
                            <Text style={styles.projectsTitle}>Your Managed Projects</Text>
                            {acceptedProjects.length > 0 ? (
                                acceptedProjects.map((p) => (
                                    <View key={p.id} style={styles.projectItem}>
                                        <Ionicons name="folder-outline" size={20} color="#EA580C" />
                                        <Text style={styles.projectName}>{p.name}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>You haven't accepted any projects yet.</Text>
                            )}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F9',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 20
    },
    content: {
        flex: 1,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 30,
    },
    adminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    adminButtonIcon: {
        marginRight: 12,
    },
    adminButtonText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    projectsSection: {
        marginTop: 20,
    },
    projectsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    projectName: {
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    }
});
