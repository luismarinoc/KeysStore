import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
} from '@expo-google-fonts/inter';

import ProjectTabs from './src/screens/ProjectDetail/ProjectTabs';
import ProjectListScreen from './src/screens/ProjectListScreen';
import ProjectFormScreen from './src/screens/ProjectFormScreen';
import CredentialFormScreen from './src/screens/ProjectDetail/CredentialFormScreen';
import LoginScreen from './src/screens/LoginScreen';
import { ProjectProvider } from './src/context/ProjectContext';
import { CredentialProvider } from './src/context/CredentialContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Project, Credential, TabCategory, Environment } from './src/types';
import { colors } from './src/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
    ProjectList: undefined;
    ProjectDetail: { project: Project };
    ProjectForm: { project?: Project } | undefined;
    CredentialForm: {
        projectId?: string;
        category?: TabCategory;
        environment?: Environment;
        credential?: Credential;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
    const { user, loading: authLoading } = useAuth();
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded && !authLoading) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, authLoading]);

    if (!fontsLoaded || authLoading) {
        return null;
    }

    if (!user) {
        return (
            <View style={styles.container} onLayout={onLayoutRootView}>
                <LoginScreen />
            </View>
        );
    }

    return (
        <View style={styles.container} onLayout={onLayoutRootView}>
            <ProjectProvider>
                <CredentialProvider>
                    <NavigationContainer>
                        <Stack.Navigator
                            initialRouteName="ProjectList"
                            screenOptions={{
                                headerShown: false, // We use our custom Layout
                                contentStyle: { backgroundColor: colors.background }
                            }}
                        >
                            <Stack.Screen
                                name="ProjectList"
                                component={ProjectListScreen}
                            />
                            <Stack.Screen
                                name="ProjectDetail"
                                component={ProjectTabs}
                            />
                            <Stack.Screen
                                name="ProjectForm"
                                component={ProjectFormScreen}
                                options={{
                                    presentation: 'modal',
                                    headerShown: false, // Custom Layout handles header
                                }}
                            />
                            <Stack.Screen
                                name="CredentialForm"
                                component={CredentialFormScreen}
                                options={{
                                    presentation: 'modal',
                                    headerShown: false, // Custom Layout handles header
                                }}
                            />
                        </Stack.Navigator>
                    </NavigationContainer>
                </CredentialProvider>
            </ProjectProvider>
        </View>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
