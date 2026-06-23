import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/api";

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });

export default function LogbookScreen() {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    if (!classId || !sectionId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/logbook", {
        params: { class_id: classId, section_id: sectionId, date },
      });
      setEntries(data.entries || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load logbook.");
    } finally {
      setLoading(false);
    }
  }, [classId, sectionId, date]);

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  if (!classId || !sectionId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Logbook</Text>
        <Text style={styles.emptyText}>Class and section information will be loaded from your profile.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Logbook</Text>
        <Text style={styles.headerSub}>{formatDate(date)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#0891b2" />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No entries for {formatDate(date)}.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => toggle(item._id)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.subjectText}>{item.subject}</Text>
                <Text style={styles.teacherText}>
                  {item.teacher_id
                    ? `${item.teacher_id.first_name} ${item.teacher_id.last_name}`
                    : ""}
                </Text>
              </View>

              {expanded === item._id && (
                <View style={styles.cardBody}>
                  <ContentSection label="Classwork" content={item.classwork} />
                  <ContentSection label="Homework" content={item.homework} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function ContentSection({ label, content }) {
  if (!content?.text && !content?.media?.length) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {!!content.text && <Text style={styles.contentText}>{content.text}</Text>}
      {content.media?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {content.media.map((m, i) =>
            m.type === "image" ? (
              <TouchableOpacity key={i} onPress={() => Linking.openURL(m.url)}>
                <Image source={{ uri: m.url }} style={styles.thumb} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                key={i}
                onPress={() => Linking.openURL(m.url)}
                style={[styles.thumb, styles.videoThumb]}
              >
                <Text style={styles.videoLabel}>▶ Video</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subjectText: { fontSize: 14, fontWeight: "700", color: "#0f172a", flex: 1 },
  teacherText: { fontSize: 11, color: "#94a3b8" },
  cardBody: { marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#0891b2",
    marginBottom: 4,
  },
  contentText: { fontSize: 13, color: "#475569", lineHeight: 20 },
  thumb: { width: 72, height: 72, borderRadius: 10, marginRight: 8, backgroundColor: "#e2e8f0" },
  videoThumb: { alignItems: "center", justifyContent: "center" },
  videoLabel: { fontSize: 11, color: "#475569" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  errorText: { fontSize: 13, color: "#ef4444", textAlign: "center", marginBottom: 12 },
  retryBtn: { backgroundColor: "#0891b2", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
