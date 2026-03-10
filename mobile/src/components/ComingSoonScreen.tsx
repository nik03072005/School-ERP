import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function ComingSoonScreen({
  title,
  subtitle = 'This feature is being built and will be available soon.',
  iconName = 'construct-outline',
}: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Brand.blueDark} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Illustration area */}
        <View style={styles.illustrationWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={52} color={Brand.blue} />
          </View>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>COMING SOON</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Footer card */}
        <View style={styles.footerCard}>
          <Ionicons name="star-outline" size={18} color={Brand.yellow} />
          <Text style={styles.footerText}>
            We&apos;re working hard to bring this to you. Stay tuned!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Brand.blueLight,
    borderRadius: Radius.full,
  },
  backText: {
    color: Brand.blueDark,
    fontWeight: '600',
    fontSize: 14,
  },
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: Radius.full,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.card,
  },
  badge: {
    backgroundColor: Brand.yellow,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  badgeText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
