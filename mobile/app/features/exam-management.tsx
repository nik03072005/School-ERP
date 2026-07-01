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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

const EXAM_TYPES = ['unit_test', 'midterm', 'final', 'practical', 'assignment', 'other'];
const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  midterm: 'Midterm',
  final: 'Final',
  practical: 'Practical',
  assignment: 'Assignment',
  other: 'Other',
};

interface ClassDoc { _id: string; name: string; grade_level: number }
interface SectionDoc { _id: string; name: string; class_id: { _id: string } }
interface SubjectRow { subject: string; max_marks: string }

interface Exam {
  _id: string; name: string; exam_type?: string;
  class_id: { _id: string; name: string };
  section_id?: { _id: string; name: string };
  subjects: { subject: string; max_marks: number }[];
  academic_year?: string;
  is_published?: boolean;
  createdAt: string;
}

export default function ExamManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/(app)');
  }, [user]);

  const [tab, setTab] = useState<'list' | 'create'>('list');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionDoc[]>([]);
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('unit_test');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [subjects, setSubjects] = useState<SubjectRow[]>([{ subject: '', max_marks: '100' }]);
  const [saving, setSaving] = useState(false);

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/exams');
      setExams(data.exams || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExams(); }, [loadExams]);

  useEffect(() => {
    Promise.allSettled([
      API.get('/setup/classes', { params: { is_active: true } }),
      API.get('/setup/sections', { params: { is_active: true } }),
    ]).then(([clsRes, secRes]) => {
      const cls: ClassDoc[] = clsRes.status === 'fulfilled' ? (clsRes.value.data.classes || []) : [];
      const sec: SectionDoc[] = secRes.status === 'fulfilled' ? (secRes.value.data.sections || []) : [];
      setClasses(cls);
      setSections(sec);
      if (cls.length > 0) setSelectedClassId(cls[0]._id);
    });
  }, []);

  useEffect(() => {
    const filtered = sections.filter(s => s.class_id._id === selectedClassId);
    setFilteredSections(filtered);
    setSelectedSectionId('');
  }, [selectedClassId, sections]);

  const addSubject = () => setSubjects(prev => [...prev, { subject: '', max_marks: '100' }]);
  const removeSubject = (idx: number) => {
    if (subjects.length <= 1) return;
    setSubjects(prev => prev.filter((_, i) => i !== idx));
  };
  const updateSubject = (idx: number, field: 'subject' | 'max_marks', value: string) => {
    setSubjects(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleCreate = async () => {
    if (!examName.trim() || !selectedClassId) {
      Alert.alert('Required', 'Exam name and class are required.');
      return;
    }
    const validSubjects = subjects.filter(s => s.subject.trim());
    if (validSubjects.length === 0) {
      Alert.alert('Required', 'Add at least one subject.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/exams', {
        name: examName.trim(),
        exam_type: examType,
        class_id: selectedClassId,
        section_id: selectedSectionId || undefined,
        academic_year: academicYear.trim() || undefined,
        subjects: validSubjects.map(s => ({
          subject: s.subject.trim(),
          max_marks: Number(s.max_marks) || 100,
        })),
      });
      setExamName('');
      setExamType('unit_test');
      setSelectedSectionId('');
      setAcademicYear('');
      setSubjects([{ subject: '', max_marks: '100' }]);
      setTab('list');
      await loadExams();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create exam.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (exam: Exam) => {
    Alert.alert(
      'Delete Exam',
      `Delete "${exam.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.delete(`/exams/${exam._id}`);
              setExams(prev => prev.filter(e => e._id !== exam._id));
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete exam.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Exam Management</Text>
          <Text style={styles.headerSub}>Create & manage exam schedules</Text>
        </View>
        <TouchableOpacity
          onPress={() => setTab(tab === 'create' ? 'list' : 'create')}
          style={styles.headerBtn}
        >
          <Ionicons name={tab === 'create' ? 'list-outline' : 'add'} size={18} color={Colors.card} />
          <Text style={styles.headerBtnText}>{tab === 'create' ? 'List' : 'Create'}</Text>
        </TouchableOpacity>
      </View>

      {tab === 'list' ? (
        loading ? (
          <View style={styles.center}><ActivityIndicator color={Brand.blueDark} size="large" /></View>
        ) : exams.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="clipboard-outline" size={52} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Exams Yet</Text>
            <Text style={styles.emptySub}>Tap Create to add your first exam schedule.</Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={() => setTab('create')}>
              <Text style={styles.createFirstBtnText}>Create Exam</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {exams.map(exam => (
              <ExamCard key={exam._id} exam={exam} onDelete={handleDelete} />
            ))}
          </ScrollView>
        )
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>New Exam Schedule</Text>

              <Text style={styles.label}>Exam Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Unit Test 1 – Q1"
                placeholderTextColor={Colors.placeholder}
                value={examName}
                onChangeText={setExamName}
              />

              <Text style={styles.label}>Exam Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={styles.pillRow}>
                  {EXAM_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.pill, examType === t && styles.pillActive]}
                      onPress={() => setExamType(t)}
                    >
                      <Text style={[styles.pillText, examType === t && styles.pillTextActive]}>
                        {EXAM_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Class *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={styles.pillRow}>
                  {classes.map(c => (
                    <TouchableOpacity
                      key={c._id}
                      style={[styles.pill, selectedClassId === c._id && styles.pillActive]}
                      onPress={() => setSelectedClassId(c._id)}
                    >
                      <Text style={[styles.pillText, selectedClassId === c._id && styles.pillTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {filteredSections.length > 0 && (
                <>
                  <Text style={styles.label}>Section (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    <View style={styles.pillRow}>
                      <TouchableOpacity
                        style={[styles.pill, !selectedSectionId && styles.pillActive]}
                        onPress={() => setSelectedSectionId('')}
                      >
                        <Text style={[styles.pillText, !selectedSectionId && styles.pillTextActive]}>All Sections</Text>
                      </TouchableOpacity>
                      {filteredSections.map(s => (
                        <TouchableOpacity
                          key={s._id}
                          style={[styles.pill, selectedSectionId === s._id && styles.pillActive]}
                          onPress={() => setSelectedSectionId(s._id)}
                        >
                          <Text style={[styles.pillText, selectedSectionId === s._id && styles.pillTextActive]}>
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              <Text style={styles.label}>Academic Year (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2025-26"
                placeholderTextColor={Colors.placeholder}
                value={academicYear}
                onChangeText={setAcademicYear}
              />

              <View style={styles.subjectsHeader}>
                <Text style={styles.label}>Subjects *</Text>
                <TouchableOpacity onPress={addSubject} style={styles.addSubBtn}>
                  <Ionicons name="add" size={14} color={Brand.blueDark} />
                  <Text style={styles.addSubText}>Add Subject</Text>
                </TouchableOpacity>
              </View>

              {subjects.map((sub, idx) => (
                <View key={idx} style={styles.subjectRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Subject name"
                    placeholderTextColor={Colors.placeholder}
                    value={sub.subject}
                    onChangeText={v => updateSubject(idx, 'subject', v)}
                  />
                  <TextInput
                    style={[styles.input, { width: 72, marginBottom: 0, textAlign: 'center' }]}
                    placeholder="Max"
                    placeholderTextColor={Colors.placeholder}
                    value={sub.max_marks}
                    onChangeText={v => updateSubject(idx, 'max_marks', v)}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <TouchableOpacity onPress={() => removeSubject(idx)} style={styles.removeSubBtn}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.submitBtn, saving && { opacity: 0.6 }, { marginTop: 16 }]}
                onPress={handleCreate}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.card} />
                  : <><Ionicons name="clipboard-outline" size={17} color={Colors.card} /><Text style={styles.submitBtnText}>Create Exam</Text></>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function ExamCard({ exam, onDelete }: { exam: Exam; onDelete: (e: Exam) => void }) {
  const [expanded, setExpanded] = useState(false);
  const totalMax = exam.subjects.reduce((s, sub) => s + sub.max_marks, 0);

  return (
    <TouchableOpacity
      style={styles.examCard}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      <View style={styles.examTop}>
        <View style={styles.examIconWrap}>
          <Ionicons name="clipboard-outline" size={20} color={Brand.blueDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.examName}>{exam.name}</Text>
          <Text style={styles.examMeta}>
            {exam.class_id.name}{exam.section_id ? ` · ${exam.section_id.name}` : ''}
            {exam.academic_year ? ` · ${exam.academic_year}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {exam.exam_type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}</Text>
            </View>
          )}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.placeholder} />
        </View>
      </View>

      {expanded && (
        <View style={styles.examBody}>
          <Text style={styles.subjectsTitle}>Subjects — Total: {totalMax} marks</Text>
          {exam.subjects.map((s, i) => (
            <View key={i} style={styles.subjectItem}>
              <Ionicons name="book-outline" size={13} color={Brand.blueDark} />
              <Text style={styles.subjectName}>{s.subject}</Text>
              <Text style={styles.subjectMax}>/{s.max_marks}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(exam)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={14} color={Colors.error} />
            <Text style={styles.deleteBtnText}>Delete Exam</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
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
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  headerBtnText: { fontSize: 13, color: Colors.card, fontWeight: '700' },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 16, ...Shadow.subtle,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: Colors.textPrimary, marginBottom: 12,
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.background,
  },
  pillActive: { backgroundColor: Brand.blueLight, borderColor: Brand.blueDark },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Brand.blueDark, fontWeight: '700' },
  subjectsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addSubBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Brand.blueLight, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  addSubText: { fontSize: 12, fontWeight: '700', color: Brand.blueDark },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeSubBtn: { padding: 4 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Brand.blueDark, borderRadius: Radius.md, height: 50, ...Shadow.card,
  },
  submitBtnText: { color: Colors.card, fontSize: 15, fontWeight: '700' },

  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  createFirstBtn: {
    marginTop: 12, backgroundColor: Brand.blueDark,
    borderRadius: Radius.md, paddingHorizontal: 28, paddingVertical: 11,
  },
  createFirstBtnText: { color: Colors.card, fontWeight: '700', fontSize: 14 },

  examCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 14, ...Shadow.subtle,
  },
  examTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  examIconWrap: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Brand.blueLight, justifyContent: 'center', alignItems: 'center',
  },
  examName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  examMeta: { fontSize: 12, color: Colors.textSecondary },
  typeBadge: {
    backgroundColor: '#EDE9FE', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: '#6D28D9' },
  examBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6 },
  subjectsTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  subjectItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subjectName: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  subjectMax: { fontSize: 12, color: Colors.placeholder, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.errorBg, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: Colors.error },
});
