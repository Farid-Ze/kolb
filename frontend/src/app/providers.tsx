import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { SmoothScrollProvider } from '../shared/providers/SmoothScrollProvider';
import { CustomCursor } from '../shared/ui/CustomCursor';
import { usePreloader } from '../shared/ui/Preloader';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

export function AppProviders({ children }: { children: ReactNode }) {
    const { isLoading, Preloader } = usePreloader(2500);

    return (
        <QueryClientProvider client={queryClient}>
            {/* Premium preloader - first impression for Awwwards jury */}
            {Preloader}
            
            <ThemeProvider>
                <AuthProvider>
                    <SmoothScrollProvider>
                        <CustomCursor />
                        {/* Gate content behind preloader for smooth reveal */}
                        {!isLoading && children}
                    </SmoothScrollProvider>
                    <Toaster position="top-center" richColors />
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
