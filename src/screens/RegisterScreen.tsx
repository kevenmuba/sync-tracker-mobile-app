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
    navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Team Member');
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const roles = ['Team Member', 'Project Admin', 'Super Admin'];

    const validateInputs = (): string | null => {
        if (!fullName.trim()) return 'Full name is required.';
        if (fullName.trim().length < 2) return 'Full name must be at least 2 characters.';
        if (!email.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            return 'Please enter a valid email address.';
        if (!password) return 'Password is required.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password))
            return 'Password must contain at least one letter and one number.';
        if (password !== confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleRegister = async () => {
        setError('');
        setSuccessMessage('');
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
            });

            if (!authError && data.user) {
                const dbRole = role.toLowerCase().replace(' ', '_');
                const { error: profileError } = await supabase
                    .from('users')
                    .update({
                        full_name: fullName.trim(),
                        role: dbRole
                    })
                    .eq('id', data.user.id);

                if (profileError) {
                    console.error('Failed to update public user profile:', profileError);
                }
            }

            if (authError) {
                if (authError.message.toLowerCase().includes('already registered') ||
                    authError.message.toLowerCase().includes('user already exists')) {
                    setError('An account with this email already exists. Please login instead.');
                } else if (authError.message.toLowerCase().includes('weak password')) {
                    setError('Password is too weak. Please use a stronger password.');
                } else if (authError.message.toLowerCase().includes('rate limit')) {
                    setError('Too many requests. Please wait a few minutes and try again.');
                } else {
                    setError(authError.message);
                }
                return;
            }

            // If email confirmation is required (common Supabase default)
            if (data.user && !data.session) {
                setSuccessMessage(
                    'Account created! Please check your email inbox to verify your account, then login.'
                );
                // Clear form after success
                setFullName(''); setEmail(''); setPassword(''); setConfirmPassword('');
                return;
            }

            // If auto-confirmed (email confirmation disabled in Supabase settings)
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
                            <Ionicons name="sync" size={24} color="#FFF" />
                        </LinearGradient>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join SyncTracker today</Text>
                    </View>

                    {/* Error Banner */}
                    {error ? (
                        <View style={styles.errorBanner}>
                            <Ionicons name="alert-circle" size={18} color="#DC2626" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Success Banner */}
                    {successMessage ? (
                        <View style={styles.successBanner}>
                            <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                            <Text style={styles.successText}>{successMessage}</Text>
                        </View>
                    ) : null}

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#9CA3AF"
                                value={fullName}
                                onChangeText={(t) => { setFullName(t); setError(''); }}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
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
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordInputWrapper}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Min. 6 chars with a number"
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.passwordInputWrapper}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        confirmPassword && confirmPassword !== password
                                            ? styles.inputError
                                            : null,
                                    ]}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={confirmPassword}
                                    onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                            {confirmPassword && confirmPassword !== password ? (
                                <Text style={styles.fieldError}>Passwords do not match</Text>
                            ) : null}
                        </View>

                        {/* Role Dropdown */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Role</Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dropdownButtonText}>{role}</Text>
                                <Ionicons
                                    name={isRoleDropdownOpen ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>

                            {isRoleDropdownOpen && (
                                <View style={styles.dropdownList}>
                                    {roles.map((r, index) => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[
                                                styles.dropdownItem,
                                                index === roles.length - 1 ? styles.dropdownItemLast : null,
                                            ]}
                                            onPress={() => {
                                                setRole(r);
                                                setIsRoleDropdownOpen(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.dropdownItemText,
                                                    role === r ? styles.dropdownItemTextActive : null,
                                                ]}
                                            >
                                                {r}
                                            </Text>
                                            {role === r && (
                                                <Ionicons name="checkmark" size={18} color="#EA580C" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
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
                                    <Text style={styles.primaryButtonText}>Create Account</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.linkContainer}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Login')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.linkText}>
                                    Already have an account?{' '}
                                    <Text style={styles.linkTextBold}>Login</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
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
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 10,
    },
    successText: {
        flex: 1,
        fontSize: 13,
        color: '#16A34A',
        fontWeight: '500',
    },
    formContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 16,
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
        paddingVertical: Platform.OS === 'ios' ? 15 : 12,
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
    fieldError: {
        fontSize: 12,
        color: '#DC2626',
        marginTop: 6,
        fontWeight: '500',
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
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 15 : 13,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    dropdownButtonText: {
        fontSize: 15,
        color: '#1F2937',
    },
    dropdownList: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemLast: {
        borderBottomWidth: 0,
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#4B5563',
    },
    dropdownItemTextActive: {
        color: '#EA580C',
        fontWeight: '600',
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
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
    linkContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    linkText: {
        color: '#6B7280',
        fontSize: 14,
    },
    linkTextBold: {
        color: '#EA580C',
        fontWeight: '700',
    },
    footerContainer: {
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});
