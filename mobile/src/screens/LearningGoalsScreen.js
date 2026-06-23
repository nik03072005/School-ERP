import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/api";

const TYPE_META = {
  video:    { icon: "🎥", label: "Video",    bg: "#ede9fe", text: "#6d28d9" },
  audio:    { icon: "🎵", label: "Audio",    bg: "#fce7f3", text: "#9d174d" },
  image:    { icon: "🖼️", label: "Image",    bg: "#fef3c7", text: "#92400e" },
  document: { icon: "📄", label: "Document", bg: "#dbeafe", text: "#1e40af" },
};

const fmtDuration = (s) => {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function LearningGoalsScreen() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const { data } = await API.get("/learning", { params });
      setContent(data.content || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleOpen = (item) => {
    Linking.openURL(item.media_url).catch(() => {});
  };

  const FILTERS = [null, "video", "audio", "image", "document"];

  return (
    <View style={styles.container}>
      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const meta = f ? TYPE_META[f] : null;
          const isActive = filterType === f;
          return (
            <TouchableOpacity
              key={f || "all"}
              onPress={() => setFilterType(f)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {meta ? `${meta.icon} ${meta.label}` : "All"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#0891b2" />
      ) : content.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No Content Yet</Text>
          <Text style={styles.emptyText}>Learning materials will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.content_type] || TYPE_META.document;
            const dur = fmtDuration(item.duration);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.82}
                onPress={() => handleOpen(item)}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>{meta.icon}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.typePillText, { color: meta.text }]}>{meta.label}</Text>
                    </View>
                    {dur ? <Text style={styles.duration}>{dur}</Text> : null}
                  </View>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  {item.subject ? (
                    <Text style={styles.subject}>{item.subject}</Text>
                  ) : null}
                  {item.description ? (
                    <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  {item.class_ids?.length > 0 && (
                    <Text style={styles.classes}>
                      {item.class_ids.map((c) => c.name || c).join(", ")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexWrap: "wrap",
  },
  filterPill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#fff",
  },
  filterPillActive: {
    backgroundColor: "#0891b2",
    borderColor: "#0891b2",
  },
  filterText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  list: { padding: 12, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    padding: 14,
    gap: 12,
  },
  cardLeft: { alignItems: "center", justifyContent: "flex-start" },
  cardIcon: { fontSize: 30 },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typePillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  duration: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  title: { fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },
  subject: { fontSize: 12, color: "#0891b2", fontWeight: "600" },
  desc: { fontSize: 12, color: "#64748b", lineHeight: 18 },
  classes: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
});
