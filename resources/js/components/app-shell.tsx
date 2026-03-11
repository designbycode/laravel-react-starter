import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSidebarStore } from '@/store/use-sidebar-store';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

export function AppShell({ children, variant = 'header' }: Props) {
    const isOpen = useSidebarStore((s) => s.isOpen);
    const setOpen = useSidebarStore((s) => s.setOpen);

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
    <SidebarProvider open={isOpen} onOpenChange={setOpen}>
      {children}
    </SidebarProvider>
  );
}
