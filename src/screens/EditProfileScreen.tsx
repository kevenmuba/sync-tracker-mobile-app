import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
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
            mediaTypes: ['images'],
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

            // Reliable file upload for Expo using FormData
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const formData = new FormData();
            formData.append('file', {
                uri,
                name: fileName,
                type: `image/${fileExt}`,
            } as any);

            const { error: uploadError } = await supabase.storage
                .from('sync-tracker-assets')
                .upload(filePath, formData, {
                    upsert: true
                });

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
                    full_name: fullName.trim(),
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

    const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || 'User') + '&background=EA580C&color=fff&size=128';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="close" size={26} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={updating} style={styles.headerBtn}>
                    {updating ? <ActivityIndicator size="small" color="#EA580C" /> : <Text style={styles.saveBtn}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: avatarUrl || defaultAvatar }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editIconBtn} onPress={pickImage}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hintText}>Tap camera to change photo</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>FULL NAME</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="e.g. Alex Wong"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={18} color="#64748B" />
                        <Text style={styles.infoBoxText}>
                            Your name and profile photo are visible to your team members and project admins.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    headerBtn: { padding: 8, minWidth: 60 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
    saveBtn: { fontSize: 16, fontWeight: '700', color: '#EA580C', textAlign: 'right' },
    content: { padding: 24 },
    avatarSection: { alignItems: 'center', marginBottom: 40 },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    editIconBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#EA580C',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    hintText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    form: { gap: 24 },
    inputGroup: { gap: 8 },
    label: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600'
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        alignItems: 'flex-start',
    },
    infoBoxText: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
});
