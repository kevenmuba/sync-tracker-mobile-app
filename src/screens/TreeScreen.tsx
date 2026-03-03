import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TreeScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const renderMember = (
        name: string,
        role: string,
        dotColor: string,
        isNested: boolean = false,
        level: number = 0,
        showConnector: boolean = false
    ) => {
        return (
            <View style={[styles.memberContainer, { marginLeft: level * 20 }]}>
                {showConnector && (
                    <View style={styles.connectorContainer}>
                        <View style={styles.lineVertical} />
                        <View style={styles.lineHorizontal} />
                    </View>
                )}
                <View style={[styles.memberCard, isNested && styles.memberCardNested]}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: `https://i.pravatar.cc/150?u=${name}` }}
                            style={styles.avatar}
                        />
                        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    </View>
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{name}</Text>
                        <Text style={styles.memberRole}>{role}</Text>
                    </View>
                    {!showConnector && !isNested && (
                        <TouchableOpacity style={styles.moreBtn}>
                            <Ionicons name="ellipsis-vertical" size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Tree View</Text>
                <TouchableOpacity>
                    <Ionicons name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.subHeader}>
                    <Text style={styles.projectHierarchyLabel}>PROJECT HIERARCHY</Text>
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>SyncTracker v2.0</Text>
                    </View>
                </View>

                {/* Main Task Card 1 */}
                <View style={styles.mainTaskCard}>
                    <View style={styles.mainTaskHeader}>
                        <View style={styles.taskIconContainer}>
                            <Ionicons name="git-branch-outline" size={20} color="#FFF" />
                        </View>
                        <View style={styles.taskTitleGroup}>
                            <Text style={styles.mainTaskLabel}>MAIN TASK</Text>
                            <Text style={styles.mainTaskTitle}>Website Redesign Phase 1</Text>
                        </View>
                        <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
                    </View>

                    <View style={styles.treeContent}>
                        {renderMember('Sarah Chen', 'Responsible Owner', '#10B981')}

                        <View style={styles.nestedGroup}>
                            <View style={styles.verticalConnectorMain} />

                            <View style={styles.memberWithConnection}>
                                <View style={styles.lConnector} />
                                {renderMember('Marcus Johnson', 'Contributor', '#10B981', true)}
                            </View>

                            <View style={styles.nestedSubGroup}>
                                <View style={styles.verticalConnectorSub} />
                                <View style={styles.memberWithConnection}>
                                    <View style={styles.lConnector} />
                                    {renderMember('Alex Wong', 'Helper (Design Assets)', '#F59E0B', true)}
                                </View>

                                <View style={styles.nestedSubGroupMore}>
                                    <View style={styles.verticalConnectorSubMore} />
                                    <View style={styles.memberWithConnection}>
                                        <View style={styles.lConnector} />
                                        {renderMember('Elena Rodriguez', 'REVIEWER', '#EF4444', true)}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.memberWithConnection}>
                                <View style={styles.lConnector} />
                                {renderMember('David Kim', 'Contributor', '#10B981', true)}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Main Task Card 2 (Collapsed) */}
                <View style={styles.collapsedTaskCard}>
                    <View style={styles.collapsedIconContainer}>
                        <Ionicons name="document-text-outline" size={20} color="#9CA3AF" />
                    </View>
                    <View style={styles.taskTitleGroup}>
                        <Text style={styles.mainTaskLabel}>MAIN TASK</Text>
                        <Text style={styles.mainTaskTitleSecondary}>Database Optimization</Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#D1D5DB" />
                </View>
            </ScrollView>
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
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    scrollContent: {
        padding: 20,
    },
    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    projectHierarchyLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    versionBadge: {
        backgroundColor: '#FFEDD5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#EA580C',
    },
    mainTaskCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 2,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    mainTaskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBF9',
        padding: 18,
        borderRadius: 18,
    },
    taskIconContainer: {
        backgroundColor: '#EA580C',
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    taskTitleGroup: {
        flex: 1,
    },
    mainTaskLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EA580C',
        letterSpacing: 0.5,
    },
    mainTaskTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    mainTaskTitleSecondary: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
    },
    treeContent: {
        padding: 16,
    },
    memberContainer: {
        marginBottom: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    memberCardNested: {
        backgroundColor: '#FFF',
        flex: 1,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    memberRole: {
        fontSize: 11,
        fontWeight: '500',
        color: '#94A3B8',
    },
    moreBtn: {
        padding: 4,
    },
    nestedGroup: {
        marginLeft: 20,
        marginTop: -8,
    },
    verticalConnectorMain: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 40,
        width: 1.5,
        backgroundColor: '#E2E8F0',
    },
    memberWithConnection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lConnector: {
        width: 15,
        height: 1.5,
        backgroundColor: '#E2E8F0',
        marginRight: 5,
        marginTop: -10,
    },
    nestedSubGroup: {
        marginLeft: 25,
        marginTop: -12,
    },
    verticalConnectorSub: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 40,
        width: 1.5,
        backgroundColor: '#E2E8F0',
    },
    nestedSubGroupMore: {
        marginLeft: 25,
        marginTop: -12,
    },
    verticalConnectorSubMore: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 40,
        width: 1.5,
        backgroundColor: '#E2E8F0',
    },
    collapsedTaskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    collapsedIconContainer: {
        backgroundColor: '#F1F5F9',
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
});
