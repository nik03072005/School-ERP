import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LogbookScreen from "../screens/LogbookScreen";
import NoticesScreen from "../screens/NoticesScreen";
import LeaveScreen from "../screens/LeaveScreen";
import ParentNotesScreen from "../screens/ParentNotesScreen";
import ProgressReportScreen from "../screens/ProgressReportScreen";
import LearningGoalsScreen from "../screens/LearningGoalsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen
          name="Logbook"
          component={LogbookScreen}
          options={{ headerShown: true, title: "Daily Logbook", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="Notices"
          component={NoticesScreen}
          options={{ headerShown: true, title: "Notices", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="Leave"
          component={LeaveScreen}
          options={{ headerShown: true, title: "Leave Application", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="ParentNotes"
          component={ParentNotesScreen}
          options={{ headerShown: true, title: "Parent Queries", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="ProgressReport"
          component={ProgressReportScreen}
          options={{ headerShown: true, title: "My Results", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="LearningGoals"
          component={LearningGoalsScreen}
          options={{ headerShown: true, title: "Learning Goals", headerBackTitle: "Back" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}