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

type Notification = {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
};

export default function NotificationsHistoryScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchNotifications = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    if (isMounted) setUserId(user.id);
                    const { data, error } = await supabase
                        .from('notifications')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (!error && data) {
                        if (isMounted) setNotifications(data);

                        // Mark as read immediately on viewing the history
                        await supabase
                            .from('notifications')
                            .update({ is_read: true })
                            .eq('user_id', user.id)
                            .eq('is_read', false);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchNotifications();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!userId) return;

        // Subscribe to real-time inserts for the current user's notifications
        const channel = supabase
            .channel('public:notifications:history')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);

                    // Automatically mark real-time received notification as read since we're viewing it
                    if (newNotification.id) {
                        supabase
                            .from('notifications')
                            .update({ is_read: true })
                            .eq('id', newNotification.id)
                            .then(); // fire and forget
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderNotification = ({ item }: { item: Notification }) => {
        // Determine icons
        let iconName = 'notifications';
        let iconColor = '#3B82F6';
        let bgStyle = styles.card;

        if (item.title.toLowerCase().includes('accepted')) {
            iconName = 'checkmark-circle';
            iconColor = '#16A34A';
            bgStyle = { ...styles.card, ...styles.cardAccepted } as any;
        } else if (item.title.toLowerCase().includes('assignment')) {
            iconName = 'document-text';
            iconColor = '#EA580C';
            bgStyle = { ...styles.card, ...styles.cardAssigned } as any;
        }

        return (
            <View style={bgStyle}>
                <View style={styles.cardHeader}>
                    <Ionicons name={iconName as any} size={22} color={iconColor} />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activity Feed</Text>

                <TouchableOpacity
                    onPress={() => navigation.navigate('ProjectAdminPending')}
                    style={styles.actionButton}
                >
                    <Ionicons name="list-outline" size={20} color="#EA580C" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No recent activity.</Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.listContainer}
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    showsVerticalScrollIndicator={false}
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
    actionButton: { padding: 8, backgroundColor: '#FFF7ED', borderRadius: 8 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 16, fontSize: 15, color: '#6B7280' },
    listContainer: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    cardAccepted: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
    cardAssigned: { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginLeft: 8 },
    cardMessage: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
    cardDate: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
});
