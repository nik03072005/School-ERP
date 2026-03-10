import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { adminService, StudentAdmission } from '@/src/api/adminService';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

function Row({ label, value }: { label: string; value?: string | boolean | null }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{display}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:      { bg: Colors.warningBg,  text: Colors.warning },
  approved:     { bg: Colors.successBg,  text: Colors.success },
  rejected:     { bg: Colors.errorBg,    text: Colors.error },
  not_submitted:{ bg: Colors.border,     text: Colors.textSecondary },
};

export default function StudentDetailScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();

  const [student, setStudent] = useState<StudentAdmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const { student: s } = await adminService.getStudentAdmission(studentId);
      setStudent(s);
    } catch {
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = () => {
    Alert.alert('Approve Admission', 'Approve this student\'s admission?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setActionLoading('approve');
          try {
            await adminService.approveAdmission(studentId!);
            setStudent((prev) => prev ? { ...prev, admission_status: 'approved' } : prev);
            Alert.alert('Approved', 'Admission has been approved.');
          } catch {
            Alert.alert('Error', 'Could not approve. Please try again.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Admission', 'Reject this student\'s admission? They will be asked to resubmit.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionLoading('reject');
          try {
            await adminService.rejectAdmission(studentId!);
            setStudent((prev) => prev ? { ...prev, admission_status: 'rejected' } : prev);
            Alert.alert('Rejected', 'Admission has been rejected.');
          } catch {
            Alert.alert('Error', 'Could not reject. Please try again.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Brand.blueDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !student) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textSecondary} />
          <Text style={s.errorText}>{error ?? 'Student not found.'}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const usr = student.user_id as any;
  const sc = STATUS_COLORS[student.admission_status] ?? STATUS_COLORS.not_submitted;
  const isPending = student.admission_status === 'pending';

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Brand.blueDark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{usr?.first_name} {usr?.last_name}</Text>
          <Text style={s.headerSub}>{usr?.email}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[s.statusText, { color: sc.text }]}>
            {student.admission_status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Section title="STUDENT INFORMATION">
          <Row label="Full Name" value={`${usr?.first_name ?? ''} ${usr?.last_name ?? ''}`} />
          <Row label="Email" value={usr?.email} />
          <Row label="Mobile" value={usr?.mobile} />
          <Row label="Gender" value={student.gender} />
          <Row label="Date of Birth" value={student.date_of_birth} />
          <Row label="Blood Group" value={student.blood_group} />
          <Row label="Aadhar Number" value={student.aadhar_number} />
          <Row label="Class Applying" value={student.class_applying} />
          <Row label="Previous School" value={student.previous_school} />
          <Row label="Home Address" value={student.address} />
          <Row label="City" value={student.city} />
          <Row label="State" value={student.state} />
          <Row label="Zip Code" value={student.zip_code} />
          <Row label="Transport Required" value={student.transport_required} />
          <Row label="Pickup / Drop Address" value={student.pickup_drop_address} />
        </Section>

        <Section title="PRIMARY GUARDIAN">
          <Row label="Name" value={student.primary_guardian_name} />
          <Row label="Relationship" value={student.primary_guardian_relationship} />
          <Row label="Phone" value={student.primary_guardian_phone} />
          <Row label="Email" value={student.primary_guardian_email} />
          <Row label="Address" value={student.primary_guardian_address} />
        </Section>

        <Section title="SECONDARY GUARDIAN">
          <Row label="Name" value={student.secondary_guardian_name} />
          <Row label="Relationship" value={student.secondary_guardian_relationship} />
          <Row label="Phone" value={student.secondary_guardian_phone} />
          <Row label="Email" value={student.secondary_guardian_email} />
        </Section>

        <Section title="EMERGENCY CONTACT">
          <Row label="Name" value={student.emergency_contact_name} />
          <Row label="Relationship" value={student.emergency_contact_relationship} />
          <Row label="Phone" value={student.emergency_contact_phone} />
        </Section>

        <Section title="MEDICAL INFORMATION">
          <Row label="Allergies" value={student.has_allergies} />
          <Row label="Allergy Details" value={student.allergies_list} />
          <Row label="Medical Conditions" value={student.has_medical_conditions} />
          <Row label="Condition Details" value={student.medical_conditions} />
          <Row label="Primary Physician" value={student.physician_name} />
          <Row label="Physician Phone" value={student.physician_phone} />
          <Row label="Insurance Provider" value={student.health_insurance_provider} />
          <Row label="Policy Number" value={student.policy_number} />
        </Section>

        <Section title="DOCUMENTS SUBMITTED">
          <Row label="Birth Certificate" value={student.docs_birth_certificate} />
          <Row label="Vaccination Card" value={student.docs_vaccination_card} />
          <Row label="Aadhar Card (Child & Parents)" value={student.docs_aadhar_card} />
          <Row label="Address Proof" value={student.docs_address_proof} />
          <Row label="Photograph (2 copies)" value={student.docs_photograph} />
          <Row label="Other" value={student.docs_other} />
        </Section>

        {student.admission_submitted_at && (
          <Text style={s.submittedAt}>
            Submitted on {new Date(student.admission_submitted_at).toLocaleString()}
          </Text>
        )}

        {/* Action buttons */}
        {isPending && (
          <View style={s.actions}>
            {actionLoading ? (
              <ActivityIndicator color={Brand.blueDark} />
            ) : (
              <>
                <TouchableOpacity style={[s.btn, s.btnApprove]} onPress={handleApprove} activeOpacity={0.8}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.btnText}>Approve Admission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.btnReject]} onPress={handleReject} activeOpacity={0.8}>
                  <Ionicons name="close-circle-outline" size={18} color="#fff" />
                  <Text style={s.btnText}>Reject Admission</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 4 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  section: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.blueDark,
    letterSpacing: 0.8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.blueLight,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  rowLabel: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1.5, textAlign: 'right' },

  submittedAt: {
    fontSize: 11,
    color: Colors.placeholder,
    textAlign: 'center',
    marginTop: 16,
  },

  actions: { gap: 10, marginTop: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: Radius.lg,
  },
  btnApprove: { backgroundColor: Colors.success },
  btnReject: { backgroundColor: Colors.error },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  errorText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Brand.blueDark,
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
