import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';
import { feeService, StudentFeeRecord, FeePayment } from '@/src/api/feeService';

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: Colors.border, text: Colors.textSecondary },
  partial: { label: 'Partial', bg: '#FEF3C7', text: '#B45309' },
  paid: { label: 'Paid', bg: Colors.successBg, text: Colors.success },
  overdue: { label: 'Overdue', bg: Colors.errorBg, text: Colors.error },
  waived: { label: 'Waived', bg: Colors.border, text: Colors.textSecondary },
};

const currency = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function FeesScreen() {
  const router = useRouter();
  const [studentFees, setStudentFees] = useState<StudentFeeRecord[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feeData, paymentData] = await Promise.all([
        feeService.getMyFee(),
        feeService.getMyPayments(),
      ]);
      setStudentFees(feeData.studentFees || []);
      setPayments(paymentData.payments || []);
    } catch {
      setStudentFees([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = studentFees[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.card} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Fees</Text>
          <Text style={styles.headerSub}>Dues, installments &amp; payment history</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.blueDark} />
        </View>
      ) : !current ? (
        <View style={styles.center}>
          <Ionicons name="card-outline" size={40} color={Colors.placeholder} />
          <Text style={styles.emptyTitle}>No Fee Record Yet</Text>
          <Text style={styles.emptyText}>Your fee details will appear here once the school assigns them.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.yearLabel}>Academic Year {current.academic_year}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Brand.blueLight }]}>
              <Text style={[styles.statNum, { color: Brand.blueDark }]}>{currency(current.net_payable)}</Text>
              <Text style={[styles.statLabel, { color: Brand.blueDark }]}>Net Payable</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.successBg }]}>
              <Text style={[styles.statNum, { color: Colors.success }]}>{currency(current.total_paid)}</Text>
              <Text style={[styles.statLabel, { color: Colors.success }]}>Paid</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.errorBg }]}>
              <Text style={[styles.statNum, { color: Colors.error }]}>{currency(current.total_due)}</Text>
              <Text style={[styles.statLabel, { color: Colors.error }]}>Due</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Installments</Text>
              <View style={[styles.badge, { backgroundColor: (STATUS_META[current.status] || STATUS_META.pending).bg }]}>
                <Text style={[styles.badgeText, { color: (STATUS_META[current.status] || STATUS_META.pending).text }]}>
                  {(STATUS_META[current.status] || STATUS_META.pending).label}
                </Text>
              </View>
            </View>

            {current.installments.map((installment, i) => {
              const meta = STATUS_META[installment.status] || STATUS_META.pending;
              return (
                <View
                  key={installment._id || installment.name}
                  style={[styles.installmentRow, i < current.installments.length - 1 && styles.rowBorder]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.installmentName}>{installment.name}</Text>
                    <Text style={styles.installmentDue}>Due {fmtDate(installment.due_date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.installmentAmount}>{currency(installment.amount_due)}</Text>
                    {installment.late_fee_applied > 0 && (
                      <Text style={styles.lateFee}>+{currency(installment.late_fee_applied)} late fee</Text>
                    )}
                    <View style={[styles.badge, { backgroundColor: meta.bg, marginTop: 4 }]}>
                      <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {current.discounts?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Discounts</Text>
              {current.discounts.map((d, i) => (
                <Text key={i} style={styles.discountText}>
                  {d.label}: {d.amount > 0 ? currency(d.amount) : ''} {d.percentage > 0 ? `${d.percentage}%` : ''} off
                </Text>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment History</Text>
            {payments.length === 0 ? (
              <Text style={styles.emptyTextSmall}>No payments recorded yet.</Text>
            ) : (
              payments.map((p, i) => (
                <TouchableOpacity
                  key={p._id}
                  style={[styles.paymentRow, i < payments.length - 1 && styles.rowBorder]}
                  onPress={() => router.push(`/features/fee-receipt/${p._id}` as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptNumber}>{p.receipt_number}</Text>
                    <Text style={styles.paymentDate}>
                      {fmtDate(p.payment_date)} · {p.payment_mode.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.paymentAmount}>{currency(p.amount)}</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: p.status === 'completed' ? Colors.successBg : Colors.errorBg, marginTop: 4 },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: p.status === 'completed' ? Colors.success : Colors.error }]}>
                        {p.status}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.placeholder} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  yearLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  badge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  installmentRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  installmentName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  installmentDue: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  installmentAmount: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  lateFee: { fontSize: 10, color: Colors.error, marginTop: 2 },
  discountText: { fontSize: 12, color: Brand.blueDark, marginTop: 4 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  receiptNumber: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'monospace' },
  paymentDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  paymentAmount: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center', marginTop: 16 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  emptyTextSmall: { fontSize: 12, color: Colors.textSecondary },
});
