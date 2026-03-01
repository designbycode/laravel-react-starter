import { Head, Link } from '@inertiajs/react';
import Wrapper from '@/components/wrapper';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { dashboard } from '@/routes/admin';
import { edit as usersEdit, index as usersIndex } from '@/routes/admin/users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil } from 'lucide-react';
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
                <Heading
                    title={
                        <div className="flex items-center gap-2">
                            <span>{user?.name ?? 'User'}</span>
                            {user.deleted_at ? (
                                <Badge variant="destructive">Deleted</Badge>
                            ) : user.is_banned ? (
                                <Badge variant="secondary">Banned</Badge>
                            ) : (
                                <Badge className="border-transparent bg-emerald-500 text-emerald-50">
                                    Active
                                </Badge>
                            )}
                        </div>
                    }
                    description="User details and account status."
                    action={
                        <div className="flex gap-2">
                            <Link href={usersIndex()}>
                                <Button size="sm" variant="secondary">
                                    <ArrowLeft className="mr-0 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                            <Link href={usersEdit(user.uuid)}>
                                <Button size="sm" variant="secondary">
                                    <Pencil className="mr-0 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        </div>
                    }
                />
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
