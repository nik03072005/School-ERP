import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  teaching_staff: 'Teacher',
  non_teaching_staff: 'Staff',
  admin: 'Administrator',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  approved: { label: 'Active', bg: Colors.successBg, text: Colors.success, icon: 'checkmark-circle' },
  pending: { label: 'Pending Approval', bg: Colors.warningBg, text: Colors.warning, icon: 'time' },
  rejected: { label: 'Rejected', bg: Colors.errorBg, text: Colors.error, icon: 'close-circle' },
};

function ComingSoonBadge() {
  return (
    <View style={styles.csBadge}>
      <Ionicons name="construct-outline" size={12} color={Brand.blueDark} />
      <Text style={styles.csBadgeText}>Coming Soon</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const status = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.pending;
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.fullName}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{ROLE_LABELS[user.role] ?? user.role}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon as any} size={12} color={status.text} />
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          {[
            { label: 'Account ID', value: user.id, icon: 'finger-print-outline' },
            { label: 'Email', value: user.email, icon: 'mail-outline' },
            { label: 'Role', value: ROLE_LABELS[user.role] ?? user.role, icon: 'briefcase-outline' },
            { label: 'Status', value: status.label, icon: 'shield-checkmark-outline' },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon as any} size={16} color={Brand.blueDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Coming soon sections */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>More Details</Text>
          {[
            'Personal Information',
            'Academic Info',
            'Emergency Contact',
            'Documents',
          ].map((item) => (
            <View key={item} style={styles.comingSoonRow}>
              <Text style={styles.comingSoonLabel}>{item}</Text>
              <ComingSoonBadge />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },

  // Header
  header: {
    backgroundColor: Brand.blue,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.blueDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Shadow.card,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.card,
    letterSpacing: 1,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.card,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 14,
  },
  roleRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  roleBadge: {
    backgroundColor: Brand.yellow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  roleText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Cards
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // Coming soon rows
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  comingSoonLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  csBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  csBadgeText: {
    fontSize: 10,
    color: Brand.blueDark,
    fontWeight: '600',
  },
});
