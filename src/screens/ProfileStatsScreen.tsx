import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const screenWidth = Dimensions.get('window').width;

export default function ProfileStatsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completed: 0,
        inSync: 0,
        blocked: 0,
        pending: 0,
        help: 0,
        totalHours: 0,
        weeklyHours: [0, 2, 5, 3, 7, 4, 6], // Placeholder if no data, will update below
    });

    useEffect(() => {
        fetchDetailedStats();
    }, []);

    const fetchDetailedStats = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch tasks by status
            const { data: tasks } = await supabase
                .from('tasks')
                .select('status')
                .eq('responsible_owner', user.id);

            const statusCounts = {
                completed: 0,
                in_sync: 0,
                blocked: 0,
                pending: 0,
                help_requested: 0,
            };

            tasks?.forEach(t => {
                if (statusCounts.hasOwnProperty(t.status)) {
                    statusCounts[t.status as keyof typeof statusCounts]++;
                }
            });

            // Fetch time logs
            const { data: hoursData } = await supabase
                .from('time_logs')
                .select('hours, created_at')
                .eq('user_id', user.id);

            const totalHours = hoursData?.reduce((acc, curr) => acc + Number(curr.hours || 0), 0) || 0;

            // Simple weekly breakdown (last 7 days)
            const weeklyHours = [0, 0, 0, 0, 0, 0, 0];
            const now = new Date();

            hoursData?.forEach(log => {
                const logDate = new Date(log.created_at);
                const diffTime = Math.abs(now.getTime() - logDate.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 7) {
                    weeklyHours[6 - diffDays] += Number(log.hours || 0);
                }
            });

            setStats({
                completed: statusCounts.completed,
                inSync: statusCounts.in_sync,
                blocked: statusCounts.blocked,
                pending: statusCounts.pending,
                help: statusCounts.help_requested,
                totalHours,
                weeklyHours,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (hours: number) => {
        if (hours <= 0) return '0h';
        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes}m`;
        }
        return `${hours.toFixed(1)}h`;
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#EA580C" />
            </View>
        );
    }

    const pieData = [
        { name: 'Done', population: stats.completed, color: '#10B981', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Sync', population: stats.inSync, color: '#3B82F6', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Blocked', population: stats.blocked, color: '#EF4444', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Pending', population: stats.pending, color: '#64748B', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Help', population: stats.help, color: '#F59E0B', legendFontColor: '#64748B', legendFontSize: 12 },
    ].filter(p => p.population > 0);

    const chartConfig = {
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#FFFFFF',
        color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.6,
        useShadowColorFromDataset: false,
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activity Analytics</Text>
                <TouchableOpacity onPress={fetchDetailedStats} style={styles.backBtn}>
                    <Ionicons name="refresh" size={20} color="#EA580C" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Status Distribution Pie Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>TASK STATUS DISTRIBUTION</Text>
                    {pieData.length > 0 ? (
                        <PieChart
                            data={pieData}
                            width={screenWidth - 40}
                            height={200}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    ) : (
                        <View style={styles.noDataBox}>
                            <Text style={styles.noDataText}>No task data available</Text>
                        </View>
                    )}
                </View>

                {/* Bar Chart for Status Counts */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>TASK VOLUMES</Text>
                    <BarChart
                        data={{
                            labels: ['Done', 'Sync', 'Blck', 'Pend', 'Help'],
                            datasets: [{ data: [stats.completed, stats.inSync, stats.blocked, stats.pending, stats.help] }],
                        }}
                        width={screenWidth - 40}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{ ...chartConfig, barPercentage: 0.5 }}
                        style={styles.chart}
                    />
                </View>

                {/* Summary Metrics */}
                <View style={styles.metricGrid}>
                    <View style={styles.metricBox}>
                        <Ionicons name="time" size={20} color="#EA580C" />
                        <Text style={styles.metricValue}>{formatTime(stats.totalHours)}</Text>
                        <Text style={styles.metricLabel}>Total Focused</Text>
                    </View>
                    <View style={styles.metricBox}>
                        <Ionicons name="checkbox" size={20} color="#10B981" />
                        <Text style={styles.metricValue}>{stats.completed}</Text>
                        <Text style={styles.metricLabel}>Done Tasks</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
    scrollContent: { padding: 20 },
    chartCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    chartTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 15 },
    chart: { marginVertical: 8, borderRadius: 16 },
    noDataBox: { height: 150, justifyContent: 'center', alignItems: 'center' },
    noDataText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    metricGrid: { flexDirection: 'row', gap: 16 },
    metricBox: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    metricValue: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginTop: 8 },
    metricLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '600' },
});
