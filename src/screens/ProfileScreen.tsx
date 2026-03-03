import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Existing Logic State
    const [role, setRole] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [acceptedProjects, setAcceptedProjects] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setEmail(user.email || '');
                    const { data } = await supabase
                        .from('users')
                        .select('role, full_name')
                        .eq('id', user.id)
                        .single();
                    if (data) {
                        setRole(data.role);
                        setFullName(data.full_name || user.email?.split('@')[0] || 'User');

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
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const renderStatCard = (icon: any, title: string, value: string, color: string, bgColor: string, trend?: string) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{title}</Text>
                <Text style={styles.statValue}>{value}</Text>
            </View>
            {trend && (
                <View style={styles.trendBadge}>
                    <Ionicons name="trending-up" size={12} color="#10B981" />
                    <Text style={styles.trendText}>{trend}</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#EA580C" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="settings-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: `https://i.pravatar.cc/150?u=${email}` }}
                            style={styles.profileAvatar}
                        />
                        <View style={styles.statusOnlineDot} />
                    </View>
                    <Text style={styles.profileName}>{fullName}</Text>
                    <View style={styles.roleLabelContainer}>
                        <Text style={styles.roleLabelText}>{role ? role.replace('_', ' ').toUpperCase() : 'USER'}</Text>
                    </View>
                    <View style={styles.emailContainer}>
                        <Ionicons name="mail-outline" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
                        <Text style={styles.emailText}>{email}</Text>
                    </View>
                </View>

                {/* Statistics Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Statistics</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    {renderStatCard('checkmark-circle-outline', 'Tasks Completed', '42', '#3B82F6', '#EFF6FF', '12%')}
                    {renderStatCard('clipboard-outline', 'Tasks In Progress', '8', '#EA580C', '#FFF7ED')}
                    {renderStatCard('time-outline', 'Total Hours Logged', '156h', '#8B5CF6', '#F5F3FF')}
                </View>

                {/* Main Actions */}
                <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#FFB796', '#EA580C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBtn}
                    >
                        <Ionicons name="pencil" size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* Existing System Info (as requested, below) */}
                <View style={styles.legacySection}>
                    <Text style={styles.legacyTitle}>System & Role Info</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Role Access:</Text>
                        <Text style={styles.infoValue}>{role?.toUpperCase()}</Text>
                    </View>

                    {role === 'super_admin' && (
                        <TouchableOpacity
                            style={styles.systemActionBtn}
                            onPress={() => navigation.navigate('CreateProject')}
                        >
                            <Text style={styles.systemActionText}>Admin Dashboard</Text>
                            <Ionicons name="chevron-forward" size={16} color="#EA580C" />
                        </TouchableOpacity>
                    )}

                    {role === 'project_admin' && (
                        <View style={styles.managedProjects}>
                            <Text style={styles.managedTitle}>Managed Projects ({acceptedProjects.length})</Text>
                            {acceptedProjects.map(p => (
                                <Text key={p.id} style={styles.managedProjectName}>• {p.name}</Text>
                            ))}
                        </View>
                    )}

                    {role === 'team_member' && (
                        <TouchableOpacity
                            style={styles.systemActionBtn}
                            onPress={() => navigation.navigate('PendingTasks')}
                        >
                            <Text style={styles.systemActionText}>Assigned Tasks</Text>
                            <Ionicons name="chevron-forward" size={16} color="#EA580C" />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
    },
    iconBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    profileAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#F3F4F6',
    },
    statusOnlineDot: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
    },
    roleLabelContainer: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    roleLabelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EA580C',
        letterSpacing: 0.5,
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emailText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#374151',
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EA580C',
        opacity: 0.8,
    },
    statsContainer: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statInfo: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94A3B8',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        marginLeft: 2,
    },
    editProfileBtn: {
        marginHorizontal: 24,
        marginBottom: 12,
    },
    gradientBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    editProfileText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    logoutBtn: {
        marginHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    logoutText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '700',
    },
    legacySection: {
        marginTop: 40,
        marginHorizontal: 24,
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    legacyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 16,
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    systemActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    systemActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EA580C',
    },
    managedProjects: {
        marginTop: 10,
    },
    managedTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 8,
    },
    managedProjectName: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 4,
    }
});
