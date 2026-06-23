import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/api";

const GRADE_COLORS = {
  A: { bg: "#dcfce7", text: "#15803d" },
  B: { bg: "#cffafe", text: "#0e7490" },
  C: { bg: "#fef3c7", text: "#b45309" },
  D: { bg: "#fee2e2", text: "#dc2626" },
};

const TYPE_LABELS = {
  unit_test: "Unit Test",
  mid_term: "Mid Term",
  final: "Final",
  other: "Other",
};

const gradeStyle = (grade) => GRADE_COLORS[grade] || { bg: "#f1f5f9", text: "#64748b" };

export default function ProgressReportScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get("/progress-reports/mine")
      .then(({ data }) => setReports(data.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0891b2" />
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No Results Yet</Text>
        <Text style={styles.emptyText}>Published results will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {reports.map((report) => {
        const exam = report.exam_schedule_id;
        const isOpen = expanded === report._id;
        const gStyle = gradeStyle(report.overall_grade);

        return (
          <TouchableOpacity
            key={report._id}
            activeOpacity={0.85}
            onPress={() => setExpanded((p) => (p === report._id ? null : report._id))}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.examName}>{exam?.name}</Text>
                <View style={styles.metaRow}>
                  {exam?.exam_type && (
                    <Text style={styles.metaChip}>{TYPE_LABELS[exam.exam_type]}</Text>
                  )}
                  {exam?.class_id?.name && (
                    <Text style={styles.metaText}>{exam.class_id.name}</Text>
                  )}
                  {exam?.academic_year && (
                    <Text style={styles.metaText}>· {exam.academic_year}</Text>
                  )}
                </View>
              </View>
              <View style={styles.gradeBlock}>
                <Text style={styles.percentage}>{report.percentage ?? "—"}%</Text>
                <View style={[styles.gradeBadge, { backgroundColor: gStyle.bg }]}>
                  <Text style={[styles.gradeText, { color: gStyle.text }]}>
                    {report.overall_grade ?? "—"}
                  </Text>
                </View>
              </View>
            </View>

            {isOpen && (
              <View style={styles.details}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 2 }]}>Subject</Text>
                  <Text style={[styles.th, styles.thRight]}>Marks</Text>
                  <Text style={[styles.th, styles.thRight]}>Max</Text>
                  <Text style={[styles.th, styles.thRight]}>Grade</Text>
                </View>
                {report.marks?.map((m, i) => {
                  const ms = gradeStyle(m.grade);
                  return (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 2 }]}>{m.subject}</Text>
                      <Text style={[styles.td, styles.tdBold, styles.tdRight]}>{m.marks_obtained}</Text>
                      <Text style={[styles.td, styles.tdRight, { color: "#94a3b8" }]}>{m.max_marks}</Text>
                      <View style={[styles.td, styles.tdRight, { alignItems: "flex-end" }]}>
                        <View style={[styles.gradePill, { backgroundColor: ms.bg }]}>
                          <Text style={[styles.gradePillText, { color: ms.text }]}>{m.grade}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                <View style={styles.totalRow}>
                  <Text style={[styles.tdBold, { flex: 2 }]}>Total</Text>
                  <Text style={[styles.tdBold, styles.tdRight]}>{report.total_marks_obtained}</Text>
                  <Text style={[styles.td, styles.tdRight, { color: "#94a3b8" }]}>{report.total_max_marks}</Text>
                  <View style={[styles.tdRight, { alignItems: "flex-end" }]}>
                    <View style={[styles.gradePill, { backgroundColor: gStyle.bg }]}>
                      <Text style={[styles.gradePillText, { color: gStyle.text }]}>{report.overall_grade}</Text>
                    </View>
                  </View>
                </View>
                {report.remarks ? (
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksText}>
                      <Text style={{ fontWeight: "700" }}>Remarks: </Text>{report.remarks}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    gap: 8,
  },
  cardLeft: { flex: 1, gap: 4 },
  examName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  metaChip: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: { fontSize: 11, color: "#94a3b8" },
  gradeBlock: { alignItems: "flex-end", gap: 4 },
  percentage: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  gradeBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  gradeText: { fontSize: 13, fontWeight: "800" },
  details: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  tableHeader: { flexDirection: "row", marginBottom: 8 },
  th: { fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  thRight: { width: 50, textAlign: "right" },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  td: { fontSize: 13, color: "#475569" },
  tdBold: { fontWeight: "700", color: "#0f172a" },
  tdRight: { width: 50, textAlign: "right" },
  gradePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  gradePillText: { fontSize: 10, fontWeight: "800" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#e2e8f0",
  },
  remarksBox: {
    marginTop: 10,
    backgroundColor: "#ecfeff",
    borderRadius: 10,
    padding: 10,
  },
  remarksText: { fontSize: 12, color: "#0e7490", lineHeight: 18 },
});
