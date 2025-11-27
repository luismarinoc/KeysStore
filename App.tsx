import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return <LoginScreen />;
    }

    return (
        <ProjectProvider>
            <CredentialProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="ProjectList">
                        <Stack.Screen
                            name="ProjectList"
                            component={ProjectListScreen}
                            options={{ title: 'Projects' }}
                        />
                        <Stack.Screen
                            name="ProjectDetail"
                            component={ProjectTabs}
                            options={({ route }) => ({ title: route.params.project.name })}
                        />
                        <Stack.Screen
                            name="ProjectForm"
                            component={ProjectFormScreen}
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="CredentialForm"
                            component={CredentialFormScreen}
                            options={{ presentation: 'modal' }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </CredentialProvider>
        </ProjectProvider>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
