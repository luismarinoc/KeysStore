export const colors = {
    primary: '#4F46E5', // Indigo 600
    secondary: '#10B981', // Emerald 500
    background: '#F9FAFB', // Gray 50 (Lighter, cleaner)
    surface: '#FFFFFF',
    textPrimary: '#111827', // Gray 900
    textSecondary: '#6B7280', // Gray 500
    border: '#E5E7EB', // Gray 200
    danger: '#EF4444', // Red 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    primaryLight: '#E0E7FF', // Indigo 100

    // New Environment Colors
    env: {
        DEV: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' }, // Blue
        QAS: { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' }, // Purple
        PRD: { bg: '#FCE7F3', text: '#9D174D', border: '#F9A8D4' }, // Pink/Red
        NONE: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }, // Gray
    },

    // Gradients
    gradients: {
        primary: ['#6366F1', '#4F46E5'], // Indigo 500 -> 600
        secondary: ['#34D399', '#10B981'], // Emerald 400 -> 500
        dark: ['#1F2937', '#111827'], // Gray 800 -> 900
    }
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    fontFamily: 'Inter_400Regular',
    h1: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    h2: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 22,
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    h3: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: colors.textPrimary,
    },
    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 24,
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: colors.textSecondary,
    },
    button: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    caption: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: colors.textSecondary,
    }
};

export const shadows = {
    soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    hard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    // Legacy support
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    fab: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
};

export const layout = {
    borderRadius: 12,
    inputHeight: 48,
    headerHeight: 64,
    maxWidth: 1200, // For web containers
};
