import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';

const MOCK_TASKS = [
    {
        id: '1',
        title: 'Finalize Project Proposal',
        project: 'SyncTracker SaaS • Phase 2',
        priority: 'HIGH PRIORITY',
        priorityColor: '#EA580C',
        priorityBg: '#FFEDD5',
        date: 'Oct 25',
        avatars: ['https://i.pravatar.cc/150?img=11'],
        extraAvatars: '+2',
        footerType: 'more'
    },
    {
        id: '2',
        title: 'UI Component Library Audit',
        project: 'Design System • Internal',
        priority: 'MEDIUM',
        priorityColor: '#6366F1',
        priorityBg: '#EEF2FF',
        date: 'Oct 28',
        avatars: ['https://i.pravatar.cc/150?img=12'],
        progress: 65,
        footerType: 'progress'
    },
    {
        id: '3',
        title: 'Weekly Team Sync',
        project: 'Operations • Recurring',
        priority: 'LOW PRIORITY',
        priorityColor: '#9CA3AF',
        priorityBg: '#F3F4F6',
        date: 'Nov 02',
        initials: [
            { id: '1', text: 'JD', bg: '#DBEAFE', color: '#2563EB' },
            { id: '2', text: 'MK', bg: '#FFEDD5', color: '#EA580C' }
        ],
        footerType: 'check'
    },
    {
        id: '4',
        title: 'API Integration Debugging',
        project: 'Backend Services • Urgent',
        priority: 'BLOCKED',
        priorityColor: '#EF4444',
        priorityBg: '#FEE2E2',
        date: 'Today',
        avatars: ['https://i.pravatar.cc/150?img=13'],
        footerType: 'view'
    }
];

const FILTERS = ['All', 'Pending', 'Completed', 'Blocked'];

export default function TasksScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const renderTaskCard = ({ item }: { item: typeof MOCK_TASKS[0] }) => {
        const isBordered = item.title === 'UI Component Library Audit'; // matching the mockup's purple border glow

        return (
            <TouchableOpacity
                style={[styles.card, isBordered && styles.cardBordered]}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: item.priorityBg }]}>
                        <Text style={[styles.priorityText, { color: item.priorityColor }]}>
                            {item.priority}
                        </Text>
                    </View>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardProject}>{item.project}</Text>

                <View style={styles.cardFooter}>
                    <View style={styles.avatarGroup}>
                        {item.avatars?.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.avatarSmall} />
                        ))}
                        {item.initials?.map((init, index) => (
                            <View
                                key={index}
                                style={[styles.initialBadge, { backgroundColor: init.bg, marginLeft: index > 0 ? -8 : 0 }]}
                            >
                                <Text style={[styles.initialText, { color: init.color }]}>{init.text}</Text>
                            </View>
                        ))}
                        {item.extraAvatars && (
                            <View style={styles.extraAvatarBadge}>
                                <Text style={styles.extraAvatarText}>{item.extraAvatars}</Text>
                            </View>
                        )}
                    </View>

                    {item.footerType === 'more' && (
                        <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
                    )}

                    {item.footerType === 'progress' && (
                        <View style={styles.progressFooter}>
                            <Text style={styles.progressText}>{item.progress}% Done</Text>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
                            </View>
                        </View>
                    )}

                    {item.footerType === 'check' && (
                        <Ionicons name="checkmark-circle-outline" size={24} color="#D1D5DB" />
                    )}

                    {item.footerType === 'view' && (
                        <View style={styles.viewBadge}>
                            <Text style={styles.viewBadgeText}>View</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tasks</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('NotificationsHistory')}>
                        <Ionicons name="notifications-outline" size={24} color="#4B5563" />
                        <View style={styles.badgeDot} />
                    </TouchableOpacity>
                    <Image source={{ uri: 'https://i.pravatar.cc/150?img=33' }} style={styles.profilePic} />
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tasks, projects..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterPill, isActive && styles.filterPillActive]}
                                onPress={() => setActiveFilter(filter)}
                            >
                                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={MOCK_TASKS}
                keyExtractor={(item) => item.id}
                renderItem={renderTaskCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
                <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F9', // Soft light gray from mockup
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bellButton: {
        marginRight: 16,
        position: 'relative',
    },
    badgeDot: {
        position: 'absolute',
        top: 2,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EA580C',
        borderWidth: 1.5,
        borderColor: '#F4F6F9',
    },
    profilePic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E5E7EB',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
    },
    filtersContainer: {
        paddingHorizontal: 20,
        paddingBottom: 4,
        gap: 12,
        marginBottom: 20,
    },
    filterPill: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    filterPillActive: {
        backgroundColor: '#EA580C',
        shadowOpacity: 0,
        elevation: 0,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // padding for FAB
        gap: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },
    cardBordered: {
        borderWidth: 1.5,
        borderColor: '#A78BFA', // Purple glow border for medium task
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    cardProject: {
        fontSize: 13,
        fontWeight: '500',
        color: '#9CA3AF',
        marginBottom: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatarGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    initialBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialText: {
        fontSize: 10,
        fontWeight: '700',
    },
    extraAvatarBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    extraAvatarText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1F2937',
    },
    progressFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    progressBarBg: {
        width: 60,
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 3,
    },
    viewBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    viewBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#8B5CF6', // Matching purple
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    }
});
