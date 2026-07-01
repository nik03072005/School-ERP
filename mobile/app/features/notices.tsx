import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

const TYPE_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  general:   { label: 'General',   bg: '#F1F5F9', text: '#475569', icon: 'information-circle-outline' },
  event:     { label: 'Event',     bg: '#F3E8FF', text: '#7E22CE', icon: 'calendar-outline' },
  exam:      { label: 'Exam',      bg: '#DBEAFE', text: '#1D4ED8', icon: 'document-text-outline' },
  fee:       { label: 'Fee',       bg: '#FEF3C7', text: '#B45309', icon: 'card-outline' },
  holiday:   { label: 'Holiday',   bg: '#DCFCE7', text: '#15803D', icon: 'sunny-outline' },
  emergency: { label: 'Emergency', bg: '#FEE2E2', text: '#DC2626', icon: 'warning-outline' },
};

const NOTICE_TYPES = ['general', 'event', 'exam', 'fee', 'holiday', 'emergency'];

interface Notice {
  _id: string; title: string; content: string; type: string;
  is_pinned: boolean; published_at?: string; createdAt: string;
  expires_at?: string; attachments?: { url: string; type: string }[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function NoticesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const canCreate = user?.role === 'teaching_staff' || user?.role === 'admin';
  const [tab, setTab] = useState<'view' | 'create'>('view');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Create form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/notices');
      setNotices(data.notices || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required', 'Please fill in title and content.');
      return;
    }
    setCreating(true);
    try {
      await API.post('/notices', {
        title: title.trim(),
        content: content.trim(),
        type,
        is_pinned: isPinned,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      });
      Alert.alert('Success', 'Notice published successfully.');
      setTitle(''); setContent(''); setType('general'); setIsPinned(false); setExpiresAt('');
      setTab('view');
      await loadNotices();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create notice.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = filter === 'all' ? notices : notices.filter(n => n.type === filter);
  const pinned = filtered.filter(n => n.is_pinned);
  const regular = filtered.filter(n => !n.is_pinned);
  const ordered = [...pinned, ...regular];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notices</Text>
          <Text style={styles.headerSub}>{notices.length} active announcement{notices.length !== 1 ? 's' : ''}</Text>
        </View>
        {canCreate && (
          <TouchableOpacity
            onPress={() => setTab(tab === 'create' ? 'view' : 'create')}
            style={[styles.createBtn, tab === 'create' && { backgroundColor: Colors.card }]}
          >
            <Ionicons name={tab === 'create' ? 'list-outline' : 'add'} size={18} color={tab === 'create' ? Brand.blueDark : Colors.card} />
            <Text style={[styles.createBtnText, tab === 'create' && { color: Brand.blueDark }]}>
              {tab === 'create' ? 'View' : 'Create'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {tab === 'create' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.formTitle}>New Notice</Text>

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={styles.pillRow}>
                {NOTICE_TYPES.map(t => {
                  const meta = TYPE_META[t];
                  const active = type === t;
                  return (
                    <TouchableOpacity
                      key={t} onPress={() => setType(t)}
                      style={[styles.typePill, active && { backgroundColor: meta.bg, borderColor: meta.text }]}
                    >
                      <Ionicons name={meta.icon as any} size={13} color={active ? meta.text : Colors.placeholder} />
                      <Text style={[styles.typePillText, active && { color: meta.text }]}>{meta.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Notice title…"
              placeholderTextColor={Colors.placeholder}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Content *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Write the full notice content here…"
              placeholderTextColor={Colors.placeholder}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Expires On (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.placeholder}
              value={expiresAt}
              onChangeText={setExpiresAt}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.pinRow}
              onPress={() => setIsPinned(p => !p)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isPinned && styles.checkboxActive]}>
                {isPinned && <Ionicons name="checkmark" size={13} color={Colors.card} />}
              </View>
              <Text style={styles.pinLabel}>Pin this notice (show at top)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, creating && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating
                ? <ActivityIndicator color={Colors.card} />
                : <><Ionicons name="megaphone-outline" size={17} color={Colors.card} /><Text style={styles.submitBtnText}>Publish Notice</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <>
          {/* Filter chips */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
            style={styles.filterBarWrap}
          >
            {['all', ...NOTICE_TYPES].map(f => {
              const meta = TYPE_META[f] ?? { label: 'All', bg: Brand.blueLight, text: Brand.blueDark, icon: 'list-outline' };
              const active = filter === f;
              return (
                <TouchableOpacity
                  key={f} onPress={() => setFilter(f)}
                  style={[styles.filterChip, active && { backgroundColor: meta.bg, borderColor: meta.text }]}
                >
                  <Text style={[styles.filterChipText, active && { color: meta.text }]}>
                    {f === 'all' ? 'All' : meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loading ? (
            <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
          ) : ordered.length === 0 ? (
            <View style={styles.center}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-off-outline" size={36} color={Brand.blueDark} />
              </View>
              <Text style={styles.emptyTitle}>No Notices</Text>
              <Text style={styles.emptyText}>There are no active notices at this time.</Text>
            </View>
          ) : (
            <FlatList
              data={ordered}
              keyExtractor={item => item._id}
              contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
              renderItem={({ item }) => <NoticeCard notice={item} expanded={expanded} onToggle={setExpanded} />}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function NoticeCard({ notice, expanded, onToggle }: { notice: Notice; expanded: string | null; onToggle: (id: string | null) => void }) {
  const meta = TYPE_META[notice.type] || TYPE_META.general;
  const isOpen = expanded === notice._id;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onToggle(isOpen ? null : notice._id)}
      style={[styles.noticeCard, notice.is_pinned && styles.noticePinned]}
    >
      <View style={styles.noticeTop}>
        <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={16} color={meta.text} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.noticeTopRow}>
            {notice.is_pinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={10} color={Brand.blueDark} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
            <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.typeBadgeText, { color: meta.text }]}>{meta.label}</Text>
            </View>
          </View>
          <Text style={styles.noticeTitle} numberOfLines={isOpen ? undefined : 2}>{notice.title}</Text>
          <Text style={styles.noticeDate}>{formatDate(notice.published_at || notice.createdAt)}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
      </View>

      {isOpen && (
        <View style={styles.noticeBody}>
          <Text style={styles.noticeContent}>{notice.content}</Text>
          {notice.expires_at && (
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={13} color={Colors.warning} />
              <Text style={styles.expiryText}>Expires {formatDate(notice.expires_at)}</Text>
            </View>
          )}
          {(notice.attachments?.length ?? 0) > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.attachLabel}>Attachments</Text>
              {notice.attachments!.map((a, i) => (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(a.url)} style={styles.attachRow}>
                  <Ionicons name="link-outline" size={14} color={Brand.blueDark} />
                  <Text style={styles.attachLink}>Attachment {i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Brand.blueDark, paddingHorizontal: 20, paddingVertical: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.card },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  createBtnText: { fontSize: 13, color: Colors.card, fontWeight: '700' },
  filterBarWrap: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 54 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: Colors.background,
  },
  filterChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  noticeCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 14, ...Shadow.subtle,
  },
  noticePinned: { borderLeftWidth: 3, borderLeftColor: Brand.blueDark },
  noticeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  noticeTopRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 4 },
  pinnedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Brand.blueLight, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  pinnedText: { fontSize: 10, color: Brand.blueDark, fontWeight: '700' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  noticeDate: { fontSize: 11, color: Colors.placeholder },
  noticeBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  noticeContent: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  expiryText: { fontSize: 12, color: Colors.warning, fontWeight: '500' },
  attachLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 6 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  attachLink: { fontSize: 13, color: Brand.blueDark, fontWeight: '600' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...Shadow.card,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  // Create form
  form: { padding: 20, gap: 4, paddingBottom: 40 },
  formTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 8 },
  pillRow: { flexDirection: 'row', gap: 8 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.background,
  },
  typePillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: Colors.textPrimary, marginBottom: 4,
  },
  textarea: { minHeight: 110 },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: Brand.blueDark, borderColor: Brand.blueDark },
  pinLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Brand.blueDark, borderRadius: Radius.md,
    height: 52, marginTop: 16, ...Shadow.card,
  },
  submitBtnText: { color: Colors.card, fontSize: 16, fontWeight: '700' },
});
