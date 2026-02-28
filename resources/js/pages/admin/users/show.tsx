import { Head } from '@inertiajs/react';
import Wrapper from '@/components/wrapper';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { dashboard } from '@/routes/admin';
import { index as usersIndex } from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';

export default function AdminUsersShow({ user }: { user: any }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: dashboard() },
        { title: 'Users', href: usersIndex() },
        { title: `View: ${user?.name ?? 'User'}`, href: usersIndex() },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User ${user.name}`} />
            <Wrapper>
                <Heading title={user?.name ?? 'User'} description="User details and account status." />
                <div className="space-y-2">
                    <div>Name: {user.name}</div>
                    <div>Email: {user.email}</div>
                    <div>
                        Status:{' '}
                        {user.deleted_at
                            ? 'Deleted'
                            : user.is_banned
                              ? 'Banned'
                              : 'Active'}
                    </div>
                </div>
            </Wrapper>
        </AppLayout>
    );
}
