import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, View } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import TasksScreen from '../screens/TasksScreen';
import TreeScreen from '../screens/TreeScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Tasks') {
                        iconName = focused ? 'checkmark-done' : 'checkmark-done-outline';
                    } else if (route.name === 'Tree') {
                        iconName = focused ? 'git-network' : 'git-network-outline';
                    } else if (route.name === 'Stats') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }} {...Platform.select({ web: { title: route.name } })}>
                            <Ionicons name={iconName as any} size={size} color={color} />
                        </View>
                    );
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#EA580C', // Orange color matching the mockup
                tabBarInactiveTintColor: '#9CA3AF',
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                    elevation: 0,
                    shadowOpacity: 0,
                    height: Platform.OS === 'ios' ? 96 : 76,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
                    backgroundColor: '#FFFFFF',
                }
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Tasks" component={TasksScreen} />
            <Tab.Screen name="Tree" component={TreeScreen} />
            <Tab.Screen name="Stats" component={StatsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
