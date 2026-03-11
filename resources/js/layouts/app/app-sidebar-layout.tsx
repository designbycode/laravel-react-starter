import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { ImpersonationBanner } from '@/components/impersonation-banner';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <ImpersonationBanner />
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
                <Toaster position="top-center" />
            </AppContent>
        </AppShell>
    );
}
