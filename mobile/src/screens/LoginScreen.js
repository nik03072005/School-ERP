import { View, Text, Button } from "react-native";

export default function LoginScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Login Screen</Text>

      <Button
        title="Go to Dashboard"
        onPress={() => navigation.navigate("Dashboard")}
      />
    </View>
  );
}