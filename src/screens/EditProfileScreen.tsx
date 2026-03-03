import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('users')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (data) {
                setFullName(data.full_name || '');
                setAvatarUrl(data.avatar_url);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setUpdating(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = uri.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const formData = new FormData();
            formData.append('file', {
                uri,
                name: fileName,
                type: `image/${fileExt}`,
            } as any);

            const { error: uploadError } = await supabase.storage
                .from('sync-tracker-assets')
                .upload(filePath, formData);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('sync-tracker-assets')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
        } catch (error: any) {
            Alert.alert('Upload Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) return Alert.alert('Error', 'Name cannot be empty');

        try {
            setUpdating(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl
                })
                .eq('id', user.id);

            if (error) throw error;
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#EA580C" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={updating}>
                    {updating ? <ActivityIndicator size="small" color="#EA580C" /> : <Text style={styles.saveBtn}>Save</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.avatarSection}>
                    <Image
                        source={{ uri: avatarUrl || `https://i.pravatar.cc/150?u=${fullName}` }}
                        style={styles.avatar}
                    />
                    <TouchableOpacity style={styles.changePicBtn} onPress={pickImage}>
                        <Text style={styles.changePicText}>Change Profile Photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter your full name"
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    saveBtn: { fontSize: 16, fontWeight: '700', color: '#EA580C' },
    content: { padding: 24 },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, backgroundColor: '#F1F5F9' },
    changePicBtn: {},
    changePicText: { color: '#EA580C', fontWeight: '600', fontSize: 14 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15 },
});
