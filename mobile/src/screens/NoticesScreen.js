import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/api";

const TYPE_COLORS = {
  general: { bg: "#f1f5f9", text: "#475569" },
  event: { bg: "#f3e8ff", text: "#7e22ce" },
  exam: { bg: "#dbeafe", text: "#1d4ed8" },
  fee: { bg: "#fef3c7", text: "#b45309" },
  holiday: { bg: "#dcfce7", text: "#15803d" },
  emergency: { bg: "#fee2e2", text: "#dc2626" },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function NoticesScreen() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/notices");
      setNotices(data.notices || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0891b2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notices & Announcements</Text>
        <Text style={styles.headerSub}>{notices.length} active notice{notices.length !== 1 ? "s" : ""}</Text>
      </View>

      {notices.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No notices at this time.</Text>
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const colors = TYPE_COLORS[item.type] || TYPE_COLORS.general;
            const isOpen = expanded === item._id;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggle(item._id)}
                style={[styles.card, item.is_pinned && styles.cardPinned]}
              >
                <View style={styles.cardTop}>
                  {item.is_pinned && (
                    <Text style={styles.pinIcon}>📌 </Text>
                  )}
                  <View style={styles.cardTopText}>
                    <Text style={styles.noticeTitle} numberOfLines={isOpen ? undefined : 2}>
                      {item.title}
                    </Text>
                    <View style={styles.badges}>
                      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.badgeText, { color: colors.text }]}>{item.type}</Text>
                      </View>
                      <Text style={styles.dateText}>
                        {formatDate(item.published_at || item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {isOpen && (
                  <View style={styles.cardBody}>
                    <Text style={styles.contentText}>{item.content}</Text>

                    {item.attachments?.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.attachLabel}>Attachments</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                          {item.attachments.map((a, i) =>
                            a.type === "image" ? (
                              <TouchableOpacity key={i} onPress={() => Linking.openURL(a.url)}>
                                <Image source={{ uri: a.url }} style={styles.thumb} />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                key={i}
                                onPress={() => Linking.openURL(a.url)}
                                style={[styles.thumb, styles.videoThumb]}
                              >
                                <Text style={styles.videoLabel}>▶ Video</Text>
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      </View>
                    )}

                    {item.expires_at && (
                      <Text style={styles.expiryText}>
                        Expires: {formatDate(item.expires_at)}
                      </Text>
                    )}
                  </View>
                )}
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
  cardPinned: { borderColor: "#a5f3fc", borderLeftWidth: 3, borderLeftColor: "#0891b2" },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  pinIcon: { fontSize: 13, marginRight: 4 },
  cardTopText: { flex: 1 },
  noticeTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  badges: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  dateText: { fontSize: 11, color: "#94a3b8" },
  cardBody: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  contentText: { fontSize: 13, color: "#475569", lineHeight: 20 },
  attachLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  thumb: { width: 68, height: 68, borderRadius: 10, backgroundColor: "#e2e8f0" },
  videoThumb: { alignItems: "center", justifyContent: "center" },
  videoLabel: { fontSize: 11, color: "#475569" },
  expiryText: { marginTop: 10, fontSize: 11, color: "#f59e0b" },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  errorText: { fontSize: 13, color: "#ef4444", textAlign: "center", marginBottom: 12 },
  retryBtn: { backgroundColor: "#0891b2", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
