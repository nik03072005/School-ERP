import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';
import { feeService, FeePayment } from '@/src/api/feeService';

const currency = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function FeeReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<FeePayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    feeService
      .getPayment(id)
      .then(({ payment }) => setPayment(payment))
      .catch(() => setPayment(null))
      .finally(() => setLoading(false));
  }, [id]);

  const student = payment?.student_id;
  const studentName = `${student?.user_id?.first_name || ''} ${student?.user_id?.last_name || ''}`.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Receipt</Text>
          <Text style={styles.headerSub}>Fee payment detail</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.blueDark} />
        </View>
      ) : !payment ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={40} color={Colors.placeholder} />
          <Text style={styles.emptyText}>Receipt not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.centerText}>
              <Text style={styles.kicker}>Fee Payment Receipt</Text>
              <Text style={styles.receiptNumber}>{payment.receipt_number}</Text>
              {payment.status === 'cancelled' && <Text style={styles.cancelledText}>CANCELLED</Text>}
            </View>

            <View style={styles.detailGrid}>
              <DetailItem label="Student" value={studentName || '—'} />
              <DetailItem label="Admission No." value={student?.admission_no || '—'} />
              <DetailItem
                label="Class"
                value={`${student?.class_id?.name || ''} ${student?.section_id ? `· ${student.section_id.name}` : ''}`.trim() || '—'}
              />
              <DetailItem label="Payment Date" value={fmtDate(payment.payment_date)} />
              <DetailItem label="Mode" value={payment.payment_mode.replace('_', ' ')} />
              {payment.transaction_ref ? <DetailItem label="Reference" value={payment.transaction_ref} /> : null}
            </View>

            <Text style={styles.sectionLabel}>Allocations</Text>
            {payment.allocations.map((a, i) => (
              <View key={i} style={styles.allocationRow}>
                <Text style={styles.allocationName}>{a.installment_name}</Text>
                <Text style={styles.allocationAmount}>{currency(a.amount)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>{currency(payment.amount)}</Text>
            </View>

            {payment.remarks ? (
              <View style={styles.remarksBox}>
                <Text style={styles.remarksText}>
                  <Text style={{ fontWeight: '700' }}>Remarks: </Text>
                  {payment.remarks}
                </Text>
              </View>
            ) : null}

            <Text style={styles.collectedBy}>
              Collected by {payment.collected_by?.first_name} {payment.collected_by?.last_name}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Brand.blueDark,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.card },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  centerText: { alignItems: 'center', marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  receiptNumber: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  cancelledText: { fontSize: 13, fontWeight: '700', color: Colors.error, marginTop: 4 },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  detailItem: { width: '50%', marginBottom: 10 },
  detailLabel: { fontSize: 10, color: Colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  allocationName: { fontSize: 13, color: Colors.textPrimary },
  allocationAmount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 2,
    borderTopColor: Colors.textPrimary,
  },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  totalAmount: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  remarksBox: { marginTop: 14, backgroundColor: '#FFEDD5', borderRadius: Radius.md, padding: 10 },
  remarksText: { fontSize: 12, color: '#9A3412' },
  collectedBy: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 16 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
});
