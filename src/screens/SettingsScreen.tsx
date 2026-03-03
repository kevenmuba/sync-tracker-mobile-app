import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // UI State
    const [activeSection, setActiveSection] = useState<'menu' | 'password'>('menu');
    const [updating, setUpdating] = useState(false);

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) return Alert.alert('Error', 'Please fill all fields');
        if (newPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
        if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');

        try {
            setUpdating(true);
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            Alert.alert('Success', 'Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
            setActiveSection('menu');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    const renderMenuItem = (icon: any, title: string, subtitle: string, onPress: () => void, color: string = '#1E293B') => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIconContainer, { backgroundColor: color + '10' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => activeSection === 'menu' ? navigation.goBack() : setActiveSection('menu')}>
                    <Ionicons name={activeSection === 'menu' ? "arrow-back" : "chevron-back"} size={26} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{activeSection === 'menu' ? 'Settings' : 'Security'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeSection === 'menu' ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>ACCOUNT SECURITY</Text>
                        {renderMenuItem(
                            'lock-closed-outline',
                            'Change Password',
                            'Update your account password',
                            () => setActiveSection('password'),
                            '#EA580C'
                        )}
                        {renderMenuItem(
                            'shield-checkmark-outline',
                            'Privacy Policy',
                            'Review our data handling',
                            () => Alert.alert('Privacy', 'Privacy policy link coming soon.'),
                            '#3B82F6'
                        )}

                        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>NOTIFICATIONS</Text>
                        {renderMenuItem(
                            'notifications-outline',
                            'Push Notifications',
                            'Manage your alerts and sounds',
                            () => { },
                            '#8B5CF6'
                        )}

                        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>APP INFO</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Version</Text>
                            <Text style={styles.infoValue}>v2.0.0 Stable</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Last Updated</Text>
                            <Text style={styles.infoValue}>March 2026</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.formSection}>
                        <Text style={styles.formTitle}>Change Password</Text>
                        <Text style={styles.formSubtitle}>Protect your account with a strong, unique password.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>NEW PASSWORD</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="••••••••"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="••••••••"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.updateBtn, updating && { opacity: 0.7 }]}
                            onPress={handleChangePassword}
                            disabled={updating}
                        >
                            {updating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.updateBtnText}>Update Password</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveSection('menu')}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
    scrollContent: { padding: 24 },
    section: { marginBottom: 32 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 16 },
    menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    menuIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuContent: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    menuSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    infoLabel: { fontSize: 15, color: '#64748B' },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    formSection: { gap: 8 },
    formTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    formSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 24 },
    inputGroup: { gap: 10, marginBottom: 16 },
    label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    input: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', fontSize: 16, fontWeight: '600', color: '#1E293B' },
    updateBtn: { backgroundColor: '#111827', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
    updateBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
    cancelBtnText: { color: '#64748B', fontWeight: '600' },
});
