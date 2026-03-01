import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Project = { id: string; name: string };
type User = { id: string; full_name: string };

export default function CreateTaskScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');
    const [ownerId, setOwnerId] = useState('');

    const [projects, setProjects] = useState<Project[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [loadingForms, setLoadingForms] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Only get projects where this user is the project_admin
                const { data: projData } = await supabase
                    .from('projects')
                    .select('id, name')
                    .eq('project_admin', user.id);

                if (projData) setProjects(projData);

                // Get team_members
                const { data: membersData } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .eq('role', 'team_member');

                if (membersData) setTeamMembers(membersData);

            } catch (err) {
                console.error(err);
            } finally {
                setLoadingForms(false);
            }
        };

        fetchFormData();
    }, []);

    const handleCreateTask = async () => {
        if (!title.trim() || !projectId || !ownerId) {
            Alert.alert('Error', 'Please fill in the task title, project, and responsible owner.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    title: title.trim(),
                    description: description.trim(),
                    project_id: projectId,
                    responsible_owner: ownerId,
                    status: 'pending'
                });

            if (error) throw error;

            Alert.alert('Success', 'Task created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create task.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingForms) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#EA580C" />
            </View>
        );
    }

    return (
        <View style={styles.background}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Task</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Select Project</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={projectId}
                                onValueChange={(itemValue) => setProjectId(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a project..." value="" color="#9CA3AF" />
                                {projects.map((p) => (
                                    <Picker.Item key={p.id} label={p.name} value={p.id} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Task Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Implement API Endpoint"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Briefly describe the task..."
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Responsible Owner</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={ownerId}
                                onValueChange={(itemValue) => setOwnerId(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Assign to team member..." value="" color="#9CA3AF" />
                                {teamMembers.map((tm) => (
                                    <Picker.Item key={tm.id} label={tm.full_name || 'No Name'} value={tm.id} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleCreateTask}
                        activeOpacity={0.85}
                        disabled={submitting}
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Create Task</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: '#F4F6F9' },
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
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
    scrollContent: { padding: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 15,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: { height: 120, paddingTop: 16 },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: { height: 50, width: '100%' },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    buttonDisabled: { opacity: 0.7 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
