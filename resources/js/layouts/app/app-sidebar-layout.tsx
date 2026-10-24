import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem, SharedData } from '@/types';
import { type PropsWithChildren, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { router, usePage } from '@inertiajs/react';

// Global Set to track shown flash timestamps across page unmounts and remounts.
// This guarantees that a flash message only ever shows ONCE on that tab/page
// and is NEVER re-shown when navigating back or when the layout re-renders.
const shownFlashTimestamps = new Set<number>();

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.time && !shownFlashTimestamps.has(flash.time)) {
            shownFlashTimestamps.add(flash.time);
            toast.dismiss();
            if (flash.success) {
                toast.success(flash.success, { id: 'app-flash-toast' });
            } else if (flash.error) {
                toast.error(flash.error, { id: 'app-flash-toast' });
            }
        }
    }, [flash]);

    // When changing menu or navigating to another page, dismiss any active toasts immediately
    // so toasts from the previous page do NOT linger or show up again on the new menu tab.
    useEffect(() => {
        return router.on('start', () => {
            toast.dismiss();
        });
    }, []);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <Toaster position="top-right" duration={3000} visibleToasts={1} />
        </AppShell>
    );
}
