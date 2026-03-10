import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors, Radius, Shadow } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export function FeatureCard({ title, subtitle, iconName, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={26} color={Brand.blueDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.arrowWrap}>
        <Ionicons name="chevron-forward" size={14} color={Brand.blue} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Brand.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  arrowWrap: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
});
