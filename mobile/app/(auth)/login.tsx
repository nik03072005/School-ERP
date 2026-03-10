import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace('/(app)/' as any);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header banner ─────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={40} color={Colors.card} />
            </View>
            <Text style={styles.schoolName}>School ERP</Text>
            <Text style={styles.tagline}>Manage smarter, teach better</Text>
          </View>

          {/* ── Card ──────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back 👋</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={18} color={emailFocused ? Brand.blueDark : Colors.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@school.com"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrap, passFocused && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={passFocused ? Brand.blueDark : Colors.placeholder} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <Text style={styles.loginBtnText}>Signing in…</Text>
                : (
                  <View style={styles.btnRow}>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.card} />
                  </View>
                )
              }
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don&apos;t have an account? </Text>
              <Link href={"/(auth)/register" as any} asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Footer note */}
          <Text style={styles.footer}>New accounts require admin approval</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    backgroundColor: Brand.blue,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Brand.blueDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...Shadow.card,
  },
  schoolName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.card,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: Radius.xl,
    padding: 24,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 22,
  },

  // Inputs
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  inputFocused: {
    borderColor: Brand.blue,
    backgroundColor: Brand.blueLight,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: { padding: 4 },

  // Button
  loginBtn: {
    backgroundColor: Brand.blue,
    borderRadius: Radius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    ...Shadow.card,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '700',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Links
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { color: Colors.textSecondary, fontSize: 14 },
  registerLink: { color: Brand.blueDark, fontWeight: '700', fontSize: 14 },

  footer: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 20,
    marginBottom: 16,
  },
});
