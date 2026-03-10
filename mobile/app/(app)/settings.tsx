import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { authService } from '@/src/api/authService';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      Alert.alert('Success ✓', 'Your password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to change password.';
      Alert.alert('Error', msg);
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            await logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          {user && (
            <Text style={styles.headerSub}>Signed in as {user.email}</Text>
          )}
        </View>

        {/* Change Password */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={Brand.blueDark} />
            </View>
            <Text style={styles.cardTitle}>Change Password</Text>
          </View>

          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={styles.passInput}
              placeholder="Enter current password"
              placeholderTextColor={Colors.placeholder}
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={styles.passInput}
              placeholder="Min. 6 characters"
              placeholderTextColor={Colors.placeholder}
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter new password"
            placeholderTextColor={Colors.placeholder}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.saveBtn, pwLoading && styles.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={pwLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {pwLoading ? 'Saving…' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="information-circle-outline" size={18} color={Brand.blueDark} />
            </View>
            <Text style={styles.cardTitle}>About</Text>
          </View>
          {[
            { label: 'App Name', value: 'School ERP' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Developer', value: 'Your School' },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, logoutLoading && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={logoutLoading}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.textPrimary} />
          <Text style={styles.logoutText}>
            {logoutLoading ? 'Signing out…' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },

  header: {
    backgroundColor: Brand.blue,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.card,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },

  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  passInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  eyeBtn: { padding: 4 },

  saveBtn: {
    backgroundColor: Brand.blue,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    ...Shadow.subtle,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: Colors.card,
    fontSize: 15,
    fontWeight: '700',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Brand.yellow,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: Radius.md,
    height: 52,
    ...Shadow.card,
  },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
