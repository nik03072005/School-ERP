import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

export default function AccountPendingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="time" size={56} color={Brand.yellow} />
        </View>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PENDING APPROVAL</Text>
        </View>

        {/* Text */}
        <Text style={styles.title}>Account Under Review</Text>
        <Text style={styles.body}>
          Your registration was successful! Your account is currently being reviewed
          by an administrator. You&apos;ll be able to log in once it&apos;s approved.
        </Text>

        {/* Info cards */}
        <View style={styles.stepsCard}>
          {[
            { icon: 'checkmark-circle', label: 'Registration submitted', done: true },
            { icon: 'search', label: 'Admin review in progress', done: false },
            { icon: 'lock-open', label: 'Account activation', done: false },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepIcon, step.done && styles.stepIconDone]}>
                <Ionicons
                  name={step.icon as any}
                  size={16}
                  color={step.done ? Colors.success : Colors.textSecondary}
                />
              </View>
              <Text style={[styles.stepText, step.done && styles.stepTextDone]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(auth)/login' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.card} />
          <Text style={styles.backBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: Radius.full,
    backgroundColor: Brand.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.card,
  },
  badge: {
    backgroundColor: Brand.yellow,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  stepsCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepIconDone: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepTextDone: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.blue,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 28,
    ...Shadow.card,
  },
  backBtnText: {
    color: Colors.card,
    fontSize: 15,
    fontWeight: '700',
  },
});
