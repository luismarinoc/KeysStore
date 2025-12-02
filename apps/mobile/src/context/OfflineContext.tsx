import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { connectivityService, ConnectivityStatus } from '../services/connectivity';

interface OfflineContextType {
    isOnline: boolean;
    isSupabaseAvailable: boolean;
    isReadOnlyMode: boolean;
    lastSyncTime: Date | null;
    syncStatus: 'idle' | 'syncing' | 'error';
    refresh: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
    const [isOnline, setIsOnline] = useState(false);
    const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

    useEffect(() => {
        console.log('[OfflineContext] Initializing...');

        // Initialize connectivity service
        connectivityService.initialize().then(status => {
            console.log('[OfflineContext] Initial status:', status);
            updateStatus(status);
        });

        // Subscribe to connectivity changes
        const unsubscribe = connectivityService.subscribe((status: ConnectivityStatus) => {
            console.log('[OfflineContext] Status update:', status);
            updateStatus(status);
        });

        return () => {
            console.log('[OfflineContext] Cleaning up...');
            unsubscribe();
            connectivityService.destroy();
        };
    }, []);

    const updateStatus = (status: ConnectivityStatus) => {
        setIsOnline(status.isOnline);
        setIsSupabaseAvailable(status.isSupabaseAvailable);

        // Update last sync time if we just came online
        if (status.isSupabaseAvailable && !isSupabaseAvailable) {
            setLastSyncTime(new Date());
            setSyncStatus('idle');
        }
    };

    const refresh = async () => {
        console.log('[OfflineContext] Manual refresh requested...');
        setSyncStatus('syncing');

        try {
            const status = await connectivityService.refresh();
            updateStatus(status);

            if (status.isSupabaseAvailable) {
                setSyncStatus('idle');
                setLastSyncTime(new Date());
            } else {
                setSyncStatus('error');
            }
        } catch (error) {
            console.error('[OfflineContext] Refresh failed:', error);
            setSyncStatus('error');
        }
    };

    // Read-only mode when Supabase is not available (but might have network)
    const isReadOnlyMode = !isSupabaseAvailable;

    const value: OfflineContextType = {
        isOnline,
        isSupabaseAvailable,
        isReadOnlyMode,
        lastSyncTime,
        syncStatus,
        refresh,
    };

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = (): OfflineContextType => {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};
