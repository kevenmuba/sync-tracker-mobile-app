import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

type Project = {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
    estimated_end_date: string;
    admin_accepted: boolean;
    project_admin: { full_name: string } | null;
};

export default function ProjectsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*, project_admin:users!project_admin(full_name)')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setProjects(data as any);
                }
            } catch (err) {
                console.error('Error fetching projects:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();

        // REAL-TIME: Listen for any updates (like admin accepting the project)
        const channel = supabase
            .channel('public:projects')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'projects' },
                () => {
                    // Refetch dynamically
                    fetchProjects();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const renderProjectCard = ({ item }: { item: Project }) => {
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description || 'No description provided.'}
                </Text>

                <View style={styles.footerRow}>
                    <View style={styles.dateInfo}>
                        <Ionicons name="person-circle-outline" size={16} color="#4F46E5" style={styles.dateIcon} />
                        <Text style={styles.dateText}>
                            Admin: {item.project_admin?.full_name || 'Unassigned'}
                            {item.project_admin && (item.admin_accepted ? ' (Accepted)' : ' (Pending)')}
                        </Text>
                    </View>
                    <View style={styles.dateInfo}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" style={styles.dateIcon} />
                        <Text style={styles.dateText}>Created: {formatDate(item.created_at)}</Text>
                    </View>
                    <View style={styles.dateInfo}>
                        <Ionicons name="flag-outline" size={14} color="#EA580C" style={styles.dateIcon} />
                        <Text style={[styles.dateText, { color: '#EA580C', fontWeight: '600' }]}>
                            Ends: {formatDate(item.estimated_end_date)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Projects</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : projects.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No projects found.</Text>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderProjectCard}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        backgroundColor: '#ECFCCB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4D7C0F',
    },
    cardDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    footerRow: {
        flexDirection: 'column',
        gap: 6,
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        marginRight: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
});
