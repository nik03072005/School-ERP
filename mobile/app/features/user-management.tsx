import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { adminService, AdminUser, StudentAdmission } from '@/src/api/adminService';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

type Tab = 'pending' | 'admissions' | 'all';

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  teaching_staff: 'Teacher',
  non_teaching_staff: 'Staff',
  admin: 'Admin',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:       { bg: Colors.warningBg,  text: Colors.warning },
  approved:      { bg: Colors.successBg,  text: Colors.success },
  rejected:      { bg: Colors.errorBg,    text: Colors.error },
  not_submitted: { bg: Colors.border,     text: Colors.textSecondary },
};

// â”€â”€â”€ Account approval card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UserCard({
  user,
  onApprove,
  onReject,
  actionLoading,
}: {
  user: AdminUser;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
}) {
  const sc = STATUS_COLORS[user.status] ?? STATUS_COLORS.pending;
  const roleName = user.role_id?.name ?? 'unknown';
  const isLoading = actionLoading === user._id;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.first_name[0]}{user.last_name[0]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
          {user.mobile ? <Text style={styles.meta}>{user.mobile}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{user.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.rolePill}>
          <Ionicons name="person-outline" size={11} color={Brand.blueDark} />
          <Text style={styles.roleText}>{ROLE_LABELS[roleName] ?? roleName}</Text>
        </View>
        <Text style={styles.dateText}>
          Registered {new Date(user.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {user.status === 'pending' && (
        <View style={styles.actions}>
          {isLoading ? (
            <ActivityIndicator color={Brand.blueDark} style={{ flex: 1 }} />
          ) : (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => onApprove(user._id)} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => onReject(user._id)} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={15} color="#fff" />
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// â”€â”€â”€ Admission card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdmissionCard({
  student,
  onViewDetails,
}: {
  student: StudentAdmission;
  onViewDetails: (studentId: string) => void;
}) {
  const usr = student.user_id as any;
  const sc = STATUS_COLORS[student.admission_status] ?? STATUS_COLORS.pending;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(usr?.first_name?.[0] ?? '?')}{(usr?.last_name?.[0] ?? '')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{usr?.first_name} {usr?.last_name}</Text>
          <Text style={styles.email} numberOfLines={1}>{usr?.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {student.admission_status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      {student.admission_submitted_at && (
        <View style={styles.cardMeta}>
          <View style={styles.rolePill}>
            <Ionicons name="document-text-outline" size={11} color={Brand.blueDark} />
            <Text style={styles.roleText}>Admission Form</Text>
          </View>
          <Text style={styles.dateText}>
            Submitted {new Date(student.admission_submitted_at).toLocaleDateString()}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.btn, styles.btnView, { marginTop: 12 }]}
        onPress={() => onViewDetails(student._id)}
        activeOpacity={0.8}
      >
        <Ionicons name="eye-outline" size={15} color={Brand.blueDark} />
        <Text style={[styles.btnText, { color: Brand.blueDark }]}>View Full Details & Approve</Text>
      </TouchableOpacity>
    </View>
  );
}

// â”€â”€â”€ Main screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function UserManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [admissions, setAdmissions] = useState<StudentAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/(app)');
  }, [user, router]);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      if (activeTab === 'admissions') {
        const data = await adminService.getPendingAdmissions();
        setAdmissions(data.students);
      } else {
        const data = activeTab === 'pending'
          ? await adminService.getPendingUsers()
          : await adminService.getAllUsers();
        setUsers(data.users);
      }
    } catch {
      setError('Failed to load. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = (id: string) => {
    Alert.alert('Approve User', 'Approve this user account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setActionLoading(id);
          try {
            await adminService.approveUser(id);
            setUsers((prev) =>
              activeTab === 'pending'
                ? prev.filter((u) => u._id !== id)
                : prev.map((u) => u._id === id ? { ...u, status: 'approved' as const, is_active: true } : u)
            );
          } catch {
            Alert.alert('Error', 'Could not approve the user.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Reject User', 'Reject this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(id);
          try {
            await adminService.rejectUser(id);
            setUsers((prev) =>
              activeTab === 'pending'
                ? prev.filter((u) => u._id !== id)
                : prev.map((u) => u._id === id ? { ...u, status: 'rejected' as const, is_active: false } : u)
            );
          } catch {
            Alert.alert('Error', 'Could not reject the user.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Accounts', count: activeTab === 'pending' ? users.length : undefined },
    { key: 'admissions', label: 'Admissions', count: activeTab === 'admissions' ? admissions.length : undefined },
    { key: 'all', label: 'All Users' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Brand.blueDark} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSub}>Approve accounts & admissions</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            {activeTab === t.key && (t.count ?? 0) > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.blueDark} />
          <Text style={styles.loadingText}>Loadingâ€¦</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'admissions' ? (
        <FlatList
          data={admissions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <AdmissionCard
              student={item}
              onViewDetails={(id) => router.push(`/features/student-detail?studentId=${id}` as any)}
            />
          )}
          contentContainerStyle={[styles.list, admissions.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[Brand.blueDark]} tintColor={Brand.blueDark} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={52} color={Colors.border} />
              <Text style={styles.emptyTitle}>No pending admissions</Text>
              <Text style={styles.emptySub}>All admission forms have been reviewed.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          )}
          contentContainerStyle={[styles.list, users.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[Brand.blueDark]} tintColor={Brand.blueDark} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={52} color={Colors.border} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'pending' ? 'No pending accounts' : 'No users found'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'pending' ? 'All accounts have been reviewed.' : 'No accounts created yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  tabs: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  tab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 5, paddingVertical: 9, borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Brand.blueDark },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  listEmpty: { flex: 1 },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 16, borderWidth: 1, borderColor: Colors.border, ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: Brand.blueDark },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  email: { fontSize: 12, color: Colors.textSecondary },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardMeta: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 12,
  },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Brand.blueLight, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  roleText: { fontSize: 11, fontWeight: '600', color: Brand.blueDark },
  dateText: { fontSize: 11, color: Colors.placeholder },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: Radius.md,
  },
  btnApprove: { backgroundColor: Colors.success },
  btnReject: { backgroundColor: Colors.error },
  btnView: {
    flex: 0,
    backgroundColor: Brand.blueLight,
    borderWidth: 1, borderColor: Brand.blueDark,
  },
  btnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 32 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  errorText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 4, backgroundColor: Brand.blueDark, paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.md },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
