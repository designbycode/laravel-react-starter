import { Link } from '@inertiajs/react';
import {
    BookOpen,
    ChevronsUpDown,
    FolderGit2,
    Gauge,
    LayoutGrid,
    Shield,
    User,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminUsersIndex } from '@/routes/admin/users';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

const mainNavItemsBase: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: '#',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: '#',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { isAdmin } = usePermissions();
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const { currentUrl } = useCurrentUrl();
    const inAdminSection = currentUrl.startsWith('/admin');
    const canAccessAdmin = isAdmin();

    const navItems =
        inAdminSection && canAccessAdmin
            ? [
                  {
                      title: 'Dashboard',
                      href: adminDashboard(),
                      icon: Gauge,
                  },
                  {
                      title: 'Users',
                      href: adminUsersIndex(),
                      icon: Users,
                  },
              ]
            : mainNavItemsBase;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            {canAccessAdmin ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            size="lg"
                                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                        >
                                            <AppLogo />
                                            <ChevronsUpDown className="ml-auto size-4" />
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                        align="start"
                                        side={
                                            isMobile
                                                ? 'bottom'
                                                : state === 'collapsed'
                                                  ? 'right'
                                                  : 'bottom'
                                        }
                                        sideOffset={4}
                                    >
                                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                                            Switch Navigation
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                prefetch
                                                href={dashboard()}
                                                className="gap-2"
                                            >
                                                <User className="size-4" />
                                                <span>User Dashboard</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link
                                                prefetch
                                                href={adminDashboard()}
                                                className="gap-2"
                                            >
                                                <Shield className="size-4" />
                                                <span>
                                                    Administrator Dashboard
                                                </span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <SidebarMenuButton size="lg" asChild>
                                    <Link href={dashboard()} prefetch>
                                        <AppLogo />
                                    </Link>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
