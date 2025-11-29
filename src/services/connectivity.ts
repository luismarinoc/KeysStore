import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from './supabase';

export type ConnectivityStatus = {
    isOnline: boolean;
    isSupabaseAvailable: boolean;
    lastChecked: Date;
};

type ConnectivityListener = (status: ConnectivityStatus) => void;

class ConnectivityService {
    private listeners: Set<ConnectivityListener> = new Set();
    private currentStatus: ConnectivityStatus = {
        isOnline: false,
        isSupabaseAvailable: false,
        lastChecked: new Date(),
    };
    private checkInterval: NodeJS.Timeout | null = null;
    private unsubscribeNetInfo: (() => void) | null = null;

    /**
     * Initialize connectivity monitoring
     */
    async initialize() {
        console.log('[Connectivity] Initializing...');

        // Check initial status
        await this.checkConnectivity();

        // Listen to network state changes
        this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
            console.log('[Connectivity] Network state changed:', state.isConnected);
            this.checkConnectivity();
        });

        // Periodic Supabase health check (every 30 seconds)
        this.checkInterval = setInterval(() => {
            this.checkConnectivity();
        }, 30000);

        return this.currentStatus;
    }

    /**
     * Clean up listeners
     */
    destroy() {
        console.log('[Connectivity] Destroying...');

        if (this.unsubscribeNetInfo) {
            this.unsubscribeNetInfo();
        }

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        this.listeners.clear();
    }

    /**
     * Check network and Supabase connectivity
     */
    async checkConnectivity(): Promise<ConnectivityStatus> {
        try {
            // Check network
            const netInfo = await NetInfo.fetch();
            const isOnline = netInfo.isConnected ?? false;

            let isSupabaseAvailable = false;

            if (isOnline) {
                // Check Supabase health
                isSupabaseAvailable = await this.checkSupabaseHealth();
            }

            const newStatus: ConnectivityStatus = {
                isOnline,
                isSupabaseAvailable,
                lastChecked: new Date(),
            };

            // Notify if status changed
            if (
                newStatus.isOnline !== this.currentStatus.isOnline ||
                newStatus.isSupabaseAvailable !== this.currentStatus.isSupabaseAvailable
            ) {
                console.log('[Connectivity] Status changed:', newStatus);
                this.currentStatus = newStatus;
                this.notifyListeners(newStatus);
            } else {
                this.currentStatus = newStatus;
            }

            return newStatus;
        } catch (error) {
            console.error('[Connectivity] Check failed:', error);
            const fallbackStatus: ConnectivityStatus = {
                isOnline: false,
                isSupabaseAvailable: false,
                lastChecked: new Date(),
            };
            this.currentStatus = fallbackStatus;
            return fallbackStatus;
        }
    }

    /**
     * Check if Supabase is reachable
     */
    private async checkSupabaseHealth(): Promise<boolean> {
        try {
            // Simple query with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const { error } = await supabase
                .from('keys_projects')
                .select('id')
                .limit(1)
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (error) {
                console.warn('[Connectivity] Supabase query error:', error.message);
                return false;
            }

            console.log('[Connectivity] Supabase is available');
            return true;
        } catch (error: any) {
            console.warn('[Connectivity] Supabase health check failed:', error.message);
            return false;
        }
    }

    /**
     * Get current connectivity status
     */
    getStatus(): ConnectivityStatus {
        return this.currentStatus;
    }

    /**
     * Subscribe to connectivity changes
     */
    subscribe(listener: ConnectivityListener): () => void {
        this.listeners.add(listener);

        // Immediately notify with current status
        listener(this.currentStatus);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(status: ConnectivityStatus) {
        this.listeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                console.error('[Connectivity] Listener error:', error);
            }
        });
    }

    /**
     * Force a connectivity check
     */
    async refresh(): Promise<ConnectivityStatus> {
        console.log('[Connectivity] Manual refresh requested');
        return await this.checkConnectivity();
    }
}

// Singleton instance
export const connectivityService = new ConnectivityService();
