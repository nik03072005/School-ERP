import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Brand, Colors } from '@/constants/theme';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Brand.blue} />
      </View>
    );
  }

  if (user) {
    return <Redirect href={"/(app)/" as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
