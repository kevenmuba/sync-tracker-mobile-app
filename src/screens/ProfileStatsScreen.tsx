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
import { LineChart, PieChart } from 'react-native-chart-kit';
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
        weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    });

    useEffect(() => {
        fetchDetailedStats();
    }, []);

    const fetchDetailedStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch tasks by status
            const { data: tasks } = await supabase
                .from('tasks')
                .select('status')
                .or(`responsible_owner.eq.${user.id},id.in.(select task_id from participants where user_id = eq.${user.id})`);

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

            // Fetch hours
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
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    weeklyHours[7 - diffDays] += Number(log.hours || 0);
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

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#EA580C" />
            </View>
        );
    }

    const pieData = [
        { name: 'Completed', population: stats.completed, color: '#10B981', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'In Progress', population: stats.inSync, color: '#3B82F6', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Blocked', population: stats.blocked, color: '#EF4444', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Help', population: stats.help, color: '#F59E0B', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detailed Statistics</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Task Distribution</Text>
                <PieChart
                    data={pieData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />

                <Text style={styles.sectionTitle}>Weekly Productivity (Hours)</Text>
                <LineChart
                    data={{
                        labels: ['7d', '6d', '5d', '4d', '3d', '2d', 'Today'],
                        datasets: [{ data: stats.weeklyHours }],
                    }}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#FFF',
                        backgroundGradientFrom: '#FFF',
                        backgroundGradientTo: '#FFF',
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: '6', strokeWidth: '2', stroke: '#EA580C' },
                    }}
                    bezier
                    style={styles.chart}
                />

                <Text style={styles.sectionTitle}>Summary Metrics</Text>
                <View style={styles.grid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{stats.totalHours.toFixed(1)}h</Text>
                        <Text style={styles.statLab}>Total Time</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{stats.completed + stats.inSync + stats.blocked + stats.pending + stats.help}</Text>
                        <Text style={styles.statLab}>Total Tasks</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    scrollContent: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 20, marginBottom: 15 },
    chart: { marginVertical: 8, borderRadius: 16 },
    grid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    statBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, width: '48%', alignItems: 'center' },
    statVal: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    statLab: { fontSize: 12, color: '#64748B', marginTop: 4 },
});
