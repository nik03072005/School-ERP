import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/api";

const STATUS_COLORS = {
  open: { bg: "#fee2e2", text: "#dc2626" },
  in_progress: { bg: "#fef3c7", text: "#b45309" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
};

const STATUS_LABELS = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function ParentNotesScreen() {
  const [tab, setTab] = useState("submit"); // "submit" | "my_notes"
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [myNotes, setMyNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const loadMyNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const { data } = await API.get("/parent-notes/mine");
      setMyNotes(data.notes || []);
    } catch {
      // silent
    } finally {
      setNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "my_notes") loadMyNotes();
  }, [tab, loadMyNotes]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Required", "Please fill in both subject and message.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/parent-notes", { subject: subject.trim(), message: message.trim() });
      Alert.alert("Sent", "Your query has been submitted. We will get back to you soon.");
      setSubject("");
      setMessage("");
      setTab("my_notes");
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to submit query.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Parent Queries</Text>
          <Text style={styles.headerSub}>Send queries or notes to the school</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === "submit" && styles.tabActive]}
            onPress={() => setTab("submit")}
          >
            <Text style={[styles.tabText, tab === "submit" && styles.tabTextActive]}>New Query</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "my_notes" && styles.tabActive]}
            onPress={() => setTab("my_notes")}
          >
            <Text style={[styles.tabText, tab === "my_notes" && styles.tabTextActive]}>My Queries</Text>
          </TouchableOpacity>
        </View>

        {tab === "submit" ? (
          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.infoText}>
              Use this to send any queries, concerns, or notes to the school management. We will respond as soon as possible.
            </Text>

            <Text style={styles.label}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Regarding attendance, Fee inquiry…"
              style={styles.input}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your query or concern in detail…"
              multiline
              numberOfLines={5}
              style={[styles.input, styles.textarea]}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Send Query</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : notesLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#0891b2" />
        ) : myNotes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No queries submitted yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {myNotes.map((note) => {
              const colors = STATUS_COLORS[note.status] || STATUS_COLORS.open;
              const isOpen = expanded === note._id;
              return (
                <TouchableOpacity
                  key={note._id}
                  activeOpacity={0.85}
                  onPress={() => setExpanded((p) => (p === note._id ? null : note._id))}
                  style={styles.noteCard}
                >
                  <View style={styles.noteTop}>
                    <Text style={styles.noteSubject} numberOfLines={isOpen ? undefined : 1}>
                      {note.subject}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.statusText, { color: colors.text }]}>
                        {STATUS_LABELS[note.status]}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>

                  {isOpen && (
                    <View style={styles.noteBody}>
                      <Text style={styles.noteMessage}>{note.message}</Text>

                      {note.replies?.length > 0 && (
                        <View style={styles.repliesSection}>
                          <Text style={styles.repliesLabel}>Replies from School</Text>
                          {note.replies.map((r, i) => (
                            <View key={i} style={styles.replyBubble}>
                              <Text style={styles.replyMeta}>
                                {r.replied_by
                                  ? `${r.replied_by.first_name} ${r.replied_by.last_name}`
                                  : "Staff"}{" "}
                                · {formatDate(r.created_at)}
                              </Text>
                              <Text style={styles.replyText}>{r.message}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {note.status === "open" && note.replies?.length === 0 && (
                        <Text style={styles.awaitingText}>Awaiting response…</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#0891b2" },
  tabText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  tabTextActive: { color: "#0891b2", fontWeight: "700" },
  form: { padding: 16, gap: 4 },
  infoText: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  textarea: { minHeight: 110 },
  submitBtn: {
    marginTop: 20,
    backgroundColor: "#0891b2",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, color: "#94a3b8" },
  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  noteTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  noteSubject: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0f172a" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  noteDate: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  noteBody: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12, gap: 8 },
  noteMessage: { fontSize: 13, color: "#475569", lineHeight: 20 },
  repliesSection: { gap: 8 },
  repliesLabel: { fontSize: 11, fontWeight: "700", color: "#0891b2", textTransform: "uppercase" },
  replyBubble: { backgroundColor: "#ecfeff", borderRadius: 10, padding: 10, gap: 4 },
  replyMeta: { fontSize: 11, fontWeight: "600", color: "#0891b2" },
  replyText: { fontSize: 13, color: "#0f172a", lineHeight: 18 },
  awaitingText: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
});
