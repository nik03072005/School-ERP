import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/api/api';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

interface Exam {
  _id: string; name: string;
  class_id: { _id: string; name: string };
  section_id?: { _id: string; name: string };
  subjects: { subject: string; max_marks: number }[];
}

interface Student {
  _id: string; roll_no?: string;
  user_id: { first_name: string; last_name: string };
}

interface Report {
  student_id: { _id: string };
  marks: { subject: string; marks_obtained: number }[];
  remarks?: string;
}

export default function ResultsScreen() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teaching_staff' || user?.role === 'admin';
  return isTeacher ? <MarksEntryScreen /> : <StudentResultsScreen />;
}

// ─── Teacher: Marks Entry ──────────────────────────────────────────────────────
function MarksEntryScreen() {
  const router = useRouter();
  const goBack = () => router.back();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, Record<string, string>>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [examsLoading, setExamsLoading] = useState(true);

  useEffect(() => {
    API.get('/exams')
      .then(({ data }) => setExams(data.exams || []))
      .catch(() => {})
      .finally(() => setExamsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedExamId) { setExam(null); setStudents([]); setMarksMap({}); return; }
    loadExamData(selectedExamId);
  }, [selectedExamId]);

  const loadExamData = async (examId: string) => {
    setLoading(true);
    try {
      const foundExam = exams.find(e => e._id === examId);
      if (!foundExam) return;
      setExam(foundExam);

      const params: Record<string, string> = { class_id: foundExam.class_id._id, limit: '200' };
      if (foundExam.section_id) params.section_id = foundExam.section_id._id;
      const { data: stuData } = await API.get('/admin/students', { params });
      const studentList: Student[] = stuData.students || [];
      setStudents(studentList);

      const { data: rpData } = await API.get(`/progress-reports/exam/${examId}`);
      const existingMarks: Record<string, Record<string, string>> = {};
      const existingRemarks: Record<string, string> = {};
      for (const rpt of (rpData.reports || []) as Report[]) {
        const sid = rpt.student_id._id;
        existingMarks[sid] = {};
        for (const m of rpt.marks) existingMarks[sid][m.subject] = String(m.marks_obtained);
        existingRemarks[sid] = rpt.remarks || '';
      }

      const table: Record<string, Record<string, string>> = {};
      for (const s of studentList) {
        table[s._id] = {};
        for (const sub of foundExam.subjects) {
          table[s._id][sub.subject] = existingMarks[s._id]?.[sub.subject] ?? '';
        }
      }
      setMarksMap(table);
      setRemarksMap(existingRemarks);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load exam data.');
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (studentId: string, subject: string, value: string) => {
    setMarksMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], [subject]: value } }));
  };

  const handleSave = async () => {
    if (!exam || students.length === 0) return;
    const reports = students
      .filter(s => Object.values(marksMap[s._id] || {}).some(v => v !== ''))
      .map(s => ({
        student_id: s._id,
        marks: exam.subjects
          .filter(sub => marksMap[s._id]?.[sub.subject] !== '')
          .map(sub => ({
            subject: sub.subject,
            max_marks: sub.max_marks,
            marks_obtained: Number(marksMap[s._id]?.[sub.subject] || 0),
          })),
        remarks: remarksMap[s._id] || '',
      }));

    if (reports.length === 0) {
      Alert.alert('No Data', 'Please enter at least one mark before saving.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/progress-reports/batch', { exam_schedule_id: selectedExamId, reports });
      setSaved(`Saved marks for ${reports.length} student(s)`);
      setTimeout(() => setSaved(''), 3500);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Marks Entry</Text>
          <Text style={styles.headerSub}>Enter student marks per exam</Text>
        </View>
        {exam && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.card} />
              : <><Ionicons name="save-outline" size={15} color={Colors.card} /><Text style={styles.saveBtnText}>Save All</Text></>
            }
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success banner */}
        {!!saved && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.successText}>{saved}</Text>
          </View>
        )}

        {/* Exam selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Exam</Text>
          {examsLoading ? (
            <ActivityIndicator color={Brand.blueDark} style={{ marginVertical: 12 }} />
          ) : exams.length === 0 ? (
            <Text style={styles.emptyText}>No exams found.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.pillRow}>
                {exams.map(e => (
                  <TouchableOpacity
                    key={e._id}
                    style={[styles.examPill, selectedExamId === e._id && styles.examPillActive]}
                    onPress={() => setSelectedExamId(e._id)}
                  >
                    <Text style={[styles.examPillText, selectedExamId === e._id && styles.examPillTextActive]}>
                      {e.name}
                    </Text>
                    <Text style={[styles.examPillSub, selectedExamId === e._id && { color: Brand.blueDark }]}>
                      {e.class_id.name}{e.section_id ? ` · ${e.section_id.name}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Marks table */}
        {exam && (
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={styles.cardTitle}>{exam.name} — Marks Sheet</Text>
              <Text style={styles.examInfo}>
                {exam.class_id.name}{exam.section_id ? ` · ${exam.section_id.name}` : ''}
              </Text>
            </View>

            {/* Subject headers */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.subjectRow}>
                  <View style={[styles.studentCell, { justifyContent: 'flex-end' }]}>
                    <Text style={styles.subjectLabel}>Student</Text>
                  </View>
                  {exam.subjects.map(s => (
                    <View key={s.subject} style={styles.markCell}>
                      <Text style={styles.subjectName}>{s.subject}</Text>
                      <Text style={styles.maxMarks}>/{s.max_marks}</Text>
                    </View>
                  ))}
                  <View style={styles.remarksCell}>
                    <Text style={styles.subjectLabel}>Remarks</Text>
                  </View>
                </View>

                {loading ? (
                  <ActivityIndicator color={Brand.blueDark} style={{ marginVertical: 24 }} />
                ) : students.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={styles.emptyText}>No students found for this exam.</Text>
                  </View>
                ) : students.map((student, i) => {
                  const name = `${student.user_id?.first_name || ''} ${student.user_id?.last_name || ''}`.trim();
                  return (
                    <View key={student._id} style={[styles.dataRow, i % 2 === 1 && styles.dataRowAlt]}>
                      <View style={styles.studentCell}>
                        <Text style={styles.studentName} numberOfLines={1}>{name}</Text>
                        {student.roll_no && <Text style={styles.rollNo}>Roll {student.roll_no}</Text>}
                      </View>
                      {exam.subjects.map(sub => (
                        <View key={sub.subject} style={styles.markCell}>
                          <TextInput
                            style={styles.markInput}
                            value={marksMap[student._id]?.[sub.subject] ?? ''}
                            onChangeText={v => updateMark(student._id, sub.subject, v)}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor={Colors.placeholder}
                            maxLength={3}
                          />
                        </View>
                      ))}
                      <View style={styles.remarksCell}>
                        <TextInput
                          style={styles.remarksInput}
                          value={remarksMap[student._id] || ''}
                          onChangeText={v => setRemarksMap(prev => ({ ...prev, [student._id]: v }))}
                          placeholder="Optional"
                          placeholderTextColor={Colors.placeholder}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Student: View Results ─────────────────────────────────────────────────────
function StudentResultsScreen() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [examsLoading, setExamsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    API.get('/exams')
      .then(({ data }) => {
        const list: Exam[] = data.exams || [];
        setExams(list);
        if (list.length > 0) setSelectedExamId(list[0]._id);
      })
      .catch(() => {})
      .finally(() => setExamsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    loadMyReports();
  }, [selectedExamId]);

  const loadMyReports = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/progress-reports/mine');
      setReports(data.reports || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const examReport = reports.find((r: any) => r.exam_schedule_id === selectedExamId || r.exam_schedule_id?._id === selectedExamId);
  const selectedExam = exams.find(e => e._id === selectedExamId);

  const totalObtained = examReport?.marks?.reduce((s: number, m: any) => s + (m.marks_obtained || 0), 0) ?? 0;
  const totalMax = examReport?.marks?.reduce((s: number, m: any) => s + (m.max_marks || 0), 0) ?? 0;
  const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : null;

  const gradeColor = pct == null ? Colors.textSecondary
    : pct >= 80 ? Colors.success
    : pct >= 60 ? Brand.blueDark
    : pct >= 40 ? Colors.warning
    : Colors.error;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Results</Text>
          <Text style={styles.headerSub}>Exam marks & performance</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Exam selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Exam</Text>
          {examsLoading ? (
            <ActivityIndicator color={Brand.blueDark} style={{ marginVertical: 12 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.pillRow}>
                {exams.map(e => (
                  <TouchableOpacity
                    key={e._id}
                    style={[styles.examPill, selectedExamId === e._id && styles.examPillActive]}
                    onPress={() => setSelectedExamId(e._id)}
                  >
                    <Text style={[styles.examPillText, selectedExamId === e._id && styles.examPillTextActive]}>{e.name}</Text>
                    <Text style={[styles.examPillSub, selectedExamId === e._id && { color: Brand.blueDark }]}>{e.class_id.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {loading ? (
          <View style={[styles.center, { paddingVertical: 40 }]}><ActivityIndicator color={Brand.blueDark} /></View>
        ) : !examReport ? (
          <View style={[styles.center, { paddingVertical: 40 }]}>
            <Ionicons name="document-text-outline" size={36} color={Colors.placeholder} />
            <Text style={[styles.emptyText, { marginTop: 12 }]}>Results not published yet for this exam.</Text>
          </View>
        ) : (
          <>
            {/* Overall score card */}
            {pct != null && (
              <View style={[styles.scoreCard, { borderColor: gradeColor + '40' }]}>
                <View style={[styles.scoreCircle, { borderColor: gradeColor }]}>
                  <Text style={[styles.scoreValue, { color: gradeColor }]}>{pct}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scoreTitle}>{selectedExam?.name}</Text>
                  <Text style={styles.scoreTotal}>{totalObtained} / {totalMax} marks</Text>
                  <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '15' }]}>
                    <Text style={[styles.gradeText, { color: gradeColor }]}>
                      {pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : pct >= 60 ? 'Average' : pct >= 40 ? 'Below Average' : 'Needs Improvement'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Subject-wise marks */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Subject-wise Marks</Text>
              {examReport.marks.map((m: any, i: number) => {
                const subPct = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
                const subColor = subPct >= 80 ? Colors.success : subPct >= 60 ? Brand.blueDark : subPct >= 40 ? Colors.warning : Colors.error;
                return (
                  <View key={i} style={[styles.subjectResultRow, i < examReport.marks.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectResultName}>{m.subject}</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${subPct}%` as any, backgroundColor: subColor }]} />
                      </View>
                    </View>
                    <View style={styles.markDisplay}>
                      <Text style={[styles.markValue, { color: subColor }]}>{m.marks_obtained}</Text>
                      <Text style={styles.markMax}>/{m.max_marks}</Text>
                    </View>
                  </View>
                );
              })}

              {examReport.remarks && (
                <View style={styles.remarkBox}>
                  <Ionicons name="chatbubble-outline" size={14} color={Brand.blueDark} />
                  <Text style={styles.remarkText}>{examReport.remarks}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
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
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  saveBtnText: { fontSize: 13, color: Colors.card, fontWeight: '700' },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 16, ...Shadow.subtle,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.successBg, borderRadius: Radius.md,
    padding: 12, borderWidth: 1, borderColor: '#BBF7D0',
  },
  successText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  pillRow: { flexDirection: 'row', gap: 8 },
  examPill: {
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.background,
    minWidth: 120,
  },
  examPillActive: { backgroundColor: Brand.blueLight, borderColor: Brand.blueDark },
  examPillText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 2 },
  examPillTextActive: { color: Brand.blueDark },
  examPillSub: { fontSize: 11, color: Colors.placeholder },
  tableHeader: { marginBottom: 12 },
  examInfo: { fontSize: 12, color: Colors.textSecondary },
  subjectRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 4 },
  dataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dataRowAlt: { backgroundColor: Colors.background },
  studentCell: { width: 120, paddingHorizontal: 6 },
  studentName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  rollNo: { fontSize: 10, color: Colors.placeholder },
  subjectLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  subjectName: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  maxMarks: { fontSize: 10, color: Colors.placeholder, textAlign: 'center' },
  markCell: { width: 70, alignItems: 'center', paddingHorizontal: 4 },
  markInput: {
    width: 52, height: 36, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background, textAlign: 'center',
    fontSize: 14, fontWeight: '700', color: Colors.textPrimary,
  },
  remarksCell: { width: 100, paddingHorizontal: 4 },
  remarksInput: {
    height: 36, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background, paddingHorizontal: 8,
    fontSize: 11, color: Colors.textPrimary,
  },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  // Student results
  scoreCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 2, padding: 20, flexDirection: 'row',
    alignItems: 'center', gap: 16, ...Shadow.card,
  },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center',
  },
  scoreValue: { fontSize: 22, fontWeight: '800' },
  scoreTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  scoreTotal: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  gradeBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  gradeText: { fontSize: 11, fontWeight: '700' },
  subjectResultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  subjectResultName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  markDisplay: { flexDirection: 'row', alignItems: 'baseline' },
  markValue: { fontSize: 18, fontWeight: '800' },
  markMax: { fontSize: 12, color: Colors.textSecondary },
  remarkBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 14, backgroundColor: Brand.blueLight,
    borderRadius: Radius.md, padding: 10,
  },
  remarkText: { fontSize: 13, color: Colors.textPrimary, flex: 1, lineHeight: 19 },
});
