import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const validateInputs = (): string | null => {
        if (!email.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            return 'Please enter a valid email address.';
        if (!password) return 'Password is required.';
        if (password.length < 6)
            return 'Password must be at least 6 characters.';
        return null;
    };

    const handleLogin = async () => {
        setError('');
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (authError) {
                // Map Supabase error codes to friendly messages
                if (authError.message.toLowerCase().includes('invalid login credentials')) {
                    setError('Incorrect email or password. Please try again.');
                } else if (authError.message.toLowerCase().includes('email not confirmed')) {
                    setError('Please confirm your email before logging in. Check your inbox.');
                } else if (authError.message.toLowerCase().includes('too many requests')) {
                    setError('Too many attempts. Please wait a few minutes and try again.');
                } else {
                    setError(authError.message);
                }
                return;
            }

            if (data.session) {
                navigation.navigate('Dashboard');
            }
        } catch (err) {
            setError('Something went wrong. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.background}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <LinearGradient
                            colors={['#EA580C', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoContainer}
                        >
                            <Ionicons name="sync" size={32} color="#FFF" />
                        </LinearGradient>
                        <Text style={styles.title}>SyncTracker</Text>
                        <Text style={styles.subtitle}>Synchronize your productivity flow</Text>
                    </View>

                    {/* Error Banner */}
                    {error ? (
                        <View style={styles.errorBanner}>
                            <Ionicons name="alert-circle" size={18} color="#DC2626" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={[styles.input, error && !password ? styles.inputError : null]}
                                placeholder="name@company.com"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={(t) => { setEmail(t); setError(''); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.passwordHeader}>
                                <Text style={styles.label}>Password</Text>
                                <TouchableOpacity>
                                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.passwordInputWrapper}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); setError(''); }}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleLogin}
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
                                    <Text style={styles.primaryButtonText}>Login</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('Register')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryButtonText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>© 2025 SyncTracker Inc. All rights reserved.</Text>
                    </View>
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
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '400',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 10,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#DC2626',
        fontWeight: '500',
    },
    formContainer: {
        flex: 1,
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
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    forgotPassword: {
        fontSize: 13,
        fontWeight: '600',
        color: '#EA580C',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    inputError: {
        borderColor: '#FCA5A5',
    },
    passwordInputWrapper: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 48,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        paddingHorizontal: 16,
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '500',
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#EA580C',
        fontSize: 16,
        fontWeight: '600',
    },
    footerContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});
