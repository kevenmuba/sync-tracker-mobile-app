import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import CreateProjectScreen from '../screens/CreateProjectScreen';
import LoginScreen from '../screens/LoginScreen';
import NotificationsHistoryScreen from '../screens/NotificationsHistoryScreen';
import ProjectAdminPendingScreen from '../screens/ProjectAdminPendingScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Dashboard: undefined; // Points to MainTabNavigator (renamed to avoid duplicate 'Home')
    CreateProject: undefined;
    Projects: undefined;
    ProjectAdminPending: undefined;
    NotificationsHistory: undefined;
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}
