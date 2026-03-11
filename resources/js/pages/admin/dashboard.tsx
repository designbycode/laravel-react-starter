import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import StatSimple from '@/components/stats/stat-simple';
import { Users, Activity, Shield, KeyRound } from 'lucide-react';
import Wrapper from '@/components/wrapper';
import AppLayout from '@/layouts/app-layout';
// TODO: Remove deprecated StatsCard import usages elsewhere if any.
import { dashboard } from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard(),
    },
];

type UsersSeries = { series: number[]; trend_percent: number } | undefined;

export default function AdminDashboard({
    stats = {
        users: 0,
        users_series: undefined,
        active_users: undefined,
        roles: 0,
        roles_series: undefined,
        permissions: 0,
        permissions_series: undefined,
    },
}: {
    stats?: {
        users: number;
        users_series?: UsersSeries;
        active_users?: { value: number; series: number[]; trend_percent: number } | undefined;
        roles: number;
        roles_series?: UsersSeries;
        permissions: number;
        permissions_series?: UsersSeries;
    };
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <Wrapper>
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <StatSimple
                        title="Users"
                        value={stats.users}
                        icon={Users}
                        isLoading={!stats.users_series}
                        chartData={stats.users_series?.series ?? []}
                        chartWidth={220}
                        chartHeight={52}
                        trendPercent={stats.users_series?.trend_percent ?? null}
                        trendLabel="vs last 14 days"
                        gradientClassName="from-emerald-500/20 via-emerald-500/10 to-transparent"
                    />

                    <StatSimple
                        title="Active Users"
                        value={stats.active_users?.value ?? 0}
                        icon={Activity}
                        isLoading={!stats.active_users}
                        chartData={stats.active_users?.series ?? []}
                        chartWidth={220}
                        chartHeight={52}
                        trendPercent={stats.active_users?.trend_percent ?? null}
                        trendLabel="vs last 14 days"
                        gradientClassName="from-indigo-500/20 via-indigo-500/10 to-transparent"
                    />

                    <StatSimple
                        title="Roles"
                        value={stats.roles}
                        icon={Shield}
                        isLoading={!stats.roles_series}
                        chartData={stats.roles_series?.series ?? []}
                        chartWidth={220}
                        chartHeight={52}
                        trendPercent={stats.roles_series?.trend_percent ?? null}
                        trendLabel="vs last 14 days"
                        gradientClassName="from-amber-500/20 via-amber-500/10 to-transparent"
                    />

                    <StatSimple
                        title="Permissions"
                        value={stats.permissions}
                        icon={KeyRound}
                        isLoading={!stats.permissions_series}
                        chartData={stats.permissions_series?.series ?? []}
                        chartWidth={220}
                        chartHeight={52}
                        trendPercent={stats.permissions_series?.trend_percent ?? null}
                        trendLabel="vs last 14 days"
                        gradientClassName="from-violet-500/20 via-violet-500/10 to-transparent"
                    />
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </Wrapper>
        </AppLayout>
    );
}
