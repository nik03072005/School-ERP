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

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  open:        { label: 'Open',        bg: '#FEF3C7', text: '#B45309', icon: 'mail-outline' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', text: '#1D4ED8', icon: 'hourglass-outline' },
  resolved:    { label: 'Resolved',    bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle-outline' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Note {
  _id: string; subject: string; message: string; status: string;
  createdAt: string; reply?: string; replied_at?: string;
  user_id?: { first_name: string; last_name: string; role: string };
}

export default function ParentNotesScreen() {
  const { user } = useAuth();
  const isStaff = user?.role === 'teaching_staff' || user?.role === 'admin';
  return isStaff ? <StaffParentNotes /> : <UserParentNotes />;
}

// ─── Staff View: See all notes + reply ────────────────────────────────────────
function StaffParentNotes() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/parent-notes');
      setNotes(data.notes || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleReply = async (noteId: string) => {
    const text = replyText[noteId]?.trim();
    if (!text) { Alert.alert('Required', 'Please enter a reply.'); return; }
    setReplying(noteId);
    try {
      await API.patch(`/parent-notes/${noteId}/reply`, { reply: text });
      setNotes(prev => prev.map(n => n._id === noteId ? { ...n, reply: text, status: 'resolved' } : n));
      setReplyText(prev => ({ ...prev, [noteId]: '' }));
      setExpanded(null);
      Alert.alert('Sent', 'Reply sent and query marked as resolved.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send reply.');
    } finally {
      setReplying(null);
    }
  };

  const filtered = filter === 'all' ? notes : notes.filter(n => n.status === filter);
  const counts = notes.reduce<Record<string, number>>((acc, n) => {
    acc[n.status] = (acc[n.status] || 0) + 1; return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Parent Queries</Text>
          <Text style={styles.headerSub}>{notes.length} total · {counts.open || 0} open</Text>
        </View>
        <TouchableOpacity onPress={loadNotes} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={18} color={Colors.card} />
        </TouchableOpacity>
      </View>

      {/* Summary row */}
      {!loading && notes.length > 0 && (
        <View style={styles.summaryRow}>
          {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => {
            const count = f === 'all' ? notes.length : counts[f] || 0;
            const meta = f === 'all' ? { bg: Brand.blueLight, text: Brand.blueDark } : { bg: STATUS_META[f].bg, text: STATUS_META[f].text };
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.summaryCard, filter === f && { borderColor: meta.text, borderWidth: 2 }]}
              >
                <Text style={[styles.summaryCount, { color: meta.text }]}>{count}</Text>
                <Text style={[styles.summaryLabel, { color: meta.text }]}>
                  {f === 'all' ? 'All' : f === 'in_progress' ? 'In Prog.' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubbles-outline" size={36} color={Brand.blueDark} />
          </View>
          <Text style={styles.emptyTitle}>{filter === 'all' ? 'No Queries' : `No ${filter} queries`}</Text>
          <Text style={styles.emptyText}>Parent queries will appear here when submitted.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status] || STATUS_META.open;
            const isOpen = expanded === item._id;
            const senderName = item.user_id
              ? `${item.user_id.first_name} ${item.user_id.last_name}`
              : 'Unknown';
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setExpanded(isOpen ? null : item._id)}
                style={styles.noteCard}
              >
                <View style={styles.noteTop}>
                  <View style={styles.senderAvatar}>
                    <Text style={styles.senderInitial}>{senderName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.noteTopRow}>
                      <Text style={styles.noteSubject} numberOfLines={1}>{item.subject}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon as any} size={10} color={meta.text} />
                        <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.senderName}>{senderName} · {formatDate(item.createdAt)}</Text>
                  </View>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={Colors.textSecondary} />
                </View>

                {!isOpen && (
                  <Text style={styles.notePreview} numberOfLines={1}>{item.message}</Text>
                )}

                {isOpen && (
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.noteBody}>
                      <Text style={styles.noteMessage}>{item.message}</Text>

                      {item.reply && (
                        <View style={styles.replyBox}>
                          <View style={styles.replyHeader}>
                            <Ionicons name="return-down-forward-outline" size={14} color={Brand.blueDark} />
                            <Text style={styles.replyLabel}>Staff Reply</Text>
                            {item.replied_at && <Text style={styles.replyDate}>{formatDate(item.replied_at)}</Text>}
                          </View>
                          <Text style={styles.replyText}>{item.reply}</Text>
                        </View>
                      )}

                      {item.status !== 'resolved' && (
                        <View style={styles.replyInputSection}>
                          <Text style={styles.replyInputLabel}>Reply to this query</Text>
                          <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Type your reply here…"
                            placeholderTextColor={Colors.placeholder}
                            value={replyText[item._id] || ''}
                            onChangeText={v => setReplyText(prev => ({ ...prev, [item._id]: v }))}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                          <TouchableOpacity
                            style={[styles.replyBtn, replying === item._id && { opacity: 0.6 }]}
                            onPress={() => handleReply(item._id)}
                            disabled={replying === item._id}
                          >
                            {replying === item._id
                              ? <ActivityIndicator size="small" color={Colors.card} />
                              : <><Ionicons name="send-outline" size={14} color={Colors.card} /><Text style={styles.replyBtnText}>Send Reply</Text></>
                            }
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </KeyboardAvoidingView>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── User/Student View: Submit + view own notes ────────────────────────────────
function UserParentNotes() {
  const router = useRouter();
  const [tab, setTab] = useState<'submit' | 'mine'>('submit');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { if (tab === 'mine') loadMyNotes(); }, [tab]);

  const loadMyNotes = async () => {
    setNotesLoading(true);
    try {
      const { data } = await API.get('/parent-notes/mine');
      setMyNotes(data.notes || []);
    } catch {
    } finally {
      setNotesLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in subject and message.');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/parent-notes', { subject: subject.trim(), message: message.trim() });
      Alert.alert('Submitted', 'Your query has been submitted. A teacher will respond shortly.');
      setSubject(''); setMessage('');
      setTab('mine');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit query.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Parent Queries</Text>
          <Text style={styles.headerSub}>Submit & track your queries</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {([['submit', 'create-outline', 'New Query'], ['mine', 'chatbubbles-outline', 'My Queries']] as const).map(([t, icon, label]) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t as any)}>
            <Ionicons name={icon} size={14} color={tab === t ? Brand.blueDark : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'submit' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.formDesc}>
              Have a question or concern? Submit it here and a teacher or admin will respond.
            </Text>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="What is your query about?"
              placeholderTextColor={Colors.placeholder}
              value={subject}
              onChangeText={setSubject}
            />
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe your question or concern in detail…"
              placeholderTextColor={Colors.placeholder}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.card} />
                : <><Ionicons name="send-outline" size={17} color={Colors.card} /><Text style={styles.submitBtnText}>Submit Query</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : notesLoading ? (
        <View style={styles.center}><ActivityIndicator color={Brand.blueDark} /></View>
      ) : myNotes.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-outline" size={36} color={Brand.blueDark} />
          </View>
          <Text style={styles.emptyTitle}>No Queries Yet</Text>
          <Text style={styles.emptyText}>You haven't submitted any queries. Tap "New Query" to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={myNotes}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status] || STATUS_META.open;
            const isOpen = expanded === item._id;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setExpanded(isOpen ? null : item._id)}
                style={styles.noteCard}
              >
                <View style={styles.noteTop}>
                  <View style={[styles.senderAvatar, { backgroundColor: Brand.blueLight }]}>
                    <Ionicons name="person-outline" size={16} color={Brand.blueDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.noteTopRow}>
                      <Text style={styles.noteSubject} numberOfLines={1}>{item.subject}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon as any} size={10} color={meta.text} />
                        <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.senderName}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={Colors.textSecondary} />
                </View>

                {!isOpen && <Text style={styles.notePreview} numberOfLines={1}>{item.message}</Text>}

                {isOpen && (
                  <View style={styles.noteBody}>
                    <Text style={styles.noteMessage}>{item.message}</Text>
                    {item.reply ? (
                      <View style={styles.replyBox}>
                        <View style={styles.replyHeader}>
                          <Ionicons name="return-down-forward-outline" size={14} color={Brand.blueDark} />
                          <Text style={styles.replyLabel}>Staff Reply</Text>
                          {item.replied_at && <Text style={styles.replyDate}>{formatDate(item.replied_at)}</Text>}
                        </View>
                        <Text style={styles.replyText}>{item.reply}</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBox}>
                        <Ionicons name="time-outline" size={14} color={Colors.warning} />
                        <Text style={styles.pendingText}>Awaiting response from staff</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
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
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryCard: {
    flex: 1, borderRadius: Radius.md, padding: 10, alignItems: 'center',
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  summaryCount: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Brand.blueDark },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Brand.blueDark, fontWeight: '700' },
  form: { padding: 20, paddingBottom: 40 },
  formDesc: {
    fontSize: 14, color: Colors.textSecondary, lineHeight: 21,
    marginBottom: 20, backgroundColor: Brand.blueLight,
    borderRadius: Radius.md, padding: 12,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: Colors.textPrimary,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Brand.blueDark, borderRadius: Radius.md,
    height: 52, marginTop: 24, ...Shadow.card,
  },
  submitBtnText: { color: Colors.card, fontSize: 16, fontWeight: '700' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...Shadow.card,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  noteCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 14, ...Shadow.subtle,
  },
  noteTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  senderAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Brand.blueDark, justifyContent: 'center', alignItems: 'center',
  },
  senderInitial: { fontSize: 15, fontWeight: '800', color: Colors.card },
  noteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flex: 1 },
  noteSubject: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  senderName: { fontSize: 11, color: Colors.placeholder, marginTop: 3 },
  notePreview: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, paddingLeft: 46 },
  noteBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  noteMessage: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  replyBox: {
    backgroundColor: Brand.blueLight, borderRadius: Radius.md, padding: 12, gap: 6,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyLabel: { fontSize: 12, fontWeight: '700', color: Brand.blueDark, flex: 1 },
  replyDate: { fontSize: 10, color: Colors.textSecondary },
  replyText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 19 },
  replyInputSection: { gap: 8 },
  replyInputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  replyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Brand.blueDark, borderRadius: Radius.md, height: 42,
  },
  replyBtnText: { color: Colors.card, fontSize: 14, fontWeight: '700' },
  pendingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.warningBg, borderRadius: Radius.md, padding: 10,
  },
  pendingText: { fontSize: 12, color: Colors.warning, fontWeight: '600' },
});
