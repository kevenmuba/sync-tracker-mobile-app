import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'CreateProject'>;
};

export default function CreateProjectScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateProject = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Project name is required.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert('Error', 'You must be logged in.');
                return;
            }

            const projectData: any = {
                name: name.trim(),
                description: description.trim(),
                created_by: user.id,
                project_admin: null,
            };

            // Only add estimated_end_date if the user provided one, else let the DB default to +1 month.
            if (endDate.trim()) {
                projectData.estimated_end_date = endDate.trim();
            }

            const { error } = await supabase
                .from('projects')
                .insert(projectData);

            if (error) throw error;

            Alert.alert('Success', 'Project created successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create project.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.background}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Project</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Project Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Website Redesign"
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Briefly describe the project..."
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Estimated End Date (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9CA3AF"
                            value={endDate}
                            onChangeText={setEndDate}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleCreateProject}
                        activeOpacity={0.85}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#EA580C', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Create Project</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#F4F6F9',
    },
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
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
    textArea: {
        height: 120,
        paddingTop: 16,
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
