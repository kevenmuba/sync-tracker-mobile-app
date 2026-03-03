import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import CreateProjectScreen from '../screens/CreateProjectScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import NotificationsHistoryScreen from '../screens/NotificationsHistoryScreen';
import PendingTasksScreen from '../screens/PendingTasksScreen';
import ProfileStatsScreen from '../screens/ProfileStatsScreen';
import ProjectAdminPendingScreen from '../screens/ProjectAdminPendingScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Dashboard: { screen?: string } | undefined;
    Home: undefined;
    Tasks: undefined;
    Tree: undefined;
    Stats: undefined;
    Profile: undefined;
    CreateProject: undefined;
    Projects: undefined;
    ProjectAdminPending: undefined;
    NotificationsHistory: undefined;
    CreateTask: undefined;
    PendingTasks: undefined;
    TaskDetails: { taskId: string; projectAdminId?: string };
    ProfileStats: undefined;
    EditProfile: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen
                    name="Dashboard"
                    component={MainTabNavigator}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="CreateProject"
                    component={CreateProjectScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Projects"
                    component={ProjectsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ProjectAdminPending"
                    component={ProjectAdminPendingScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="NotificationsHistory"
                    component={NotificationsHistoryScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="CreateTask"
                    component={CreateTaskScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="PendingTasks"
                    component={PendingTasksScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="TaskDetails"
                    component={TaskDetailsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen name="ProfileStats" component={ProfileStatsScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
