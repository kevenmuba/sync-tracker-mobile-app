import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
    const [updating, setUpdating] = useState(false);
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
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Change Password</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="••••••••"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="••••••••"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.updateBtn, updating && { opacity: 0.7 }]}
                    onPress={handleChangePassword}
                    disabled={updating}
                >
                    {updating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.updateBtnText}>Update Password</Text>}
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>About SyncTracker</Text>
                <Text style={styles.versionText}>Version 2.0.0 (Global Sync Enabled)</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    content: { padding: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    updateBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    updateBtnText: { color: '#FFF', fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 32 },
    versionText: { fontSize: 12, color: '#94A3B8' },
});
