export const colors = {
    primary: '#4F46E5', // Indigo 600
    secondary: '#10B981', // Emerald 500
    background: '#F3F4F6', // Gray 100
    surface: '#FFFFFF',
    textPrimary: '#111827', // Gray 900
    textSecondary: '#6B7280', // Gray 500
    border: '#E5E7EB', // Gray 200
    danger: '#EF4444', // Red 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    primaryLight: '#E0E7FF', // Indigo 100
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
};

export const typography = {
    h1: {
        fontSize: 24,
        fontWeight: 'bold' as 'bold',
        color: colors.textPrimary,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600' as '600',
        color: colors.textPrimary,
    },
    body: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    label: {
        fontSize: 14,
        fontWeight: '500' as '500',
        color: colors.textSecondary,
    },
    button: {
        fontSize: 16,
        fontWeight: '600' as '600',
        color: '#FFFFFF',
    },
};

export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    fab: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
};

export const layout = {
    borderRadius: 12,
    inputHeight: 48,
};
