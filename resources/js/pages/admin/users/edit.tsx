import { Head, Link, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, update } from '@/routes/admin/users';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import Wrapper from '@/components/wrapper';
import { AvatarUploader } from '@/components/avatar-uploader';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

export default function AdminUsersEdit({
    user,
    roles = [],
}: {
    user: any;
    roles: string[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: dashboard() },
        { title: 'Users', href: usersIndex() },
        { title: `Edit: ${user?.name ?? 'User'}`, href: usersIndex() },
    ];
    const initialRoles = (user.roles || []).map((r: any) => r.name) as string[];
    const form = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
        password: '',
        email_verified: !!user.email_verified_at,
        roles: initialRoles,
    });

    const toggleRole = (role: string, checked: boolean | string) => {
        form.setData(
            'roles',
            checked
                ? [...form.data.roles, role]
                : form.data.roles.filter((r: string) => r !== role),
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(update(user.uuid), {
            onSuccess: () => toast.success('User saved'),
            onError: () => toast.error('Could not save user'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />
            <Wrapper>
                <Heading
                    title={`Edit ${user?.name ?? 'User'}`}
                    description="Update user details, verification status, roles, or ban state."
                    action={
                        <Link href={usersIndex()}>
                            <Button size="sm" variant="secondary">
                                <ArrowLeft className="mr-0 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    }
                />
                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <label className="mb-2 text-sm font-medium">
                            Avatar
                        </label>
                        <AvatarUploader
                            currentAvatarUrl={user.avatar_url || user.avatar}
                            userName={user.name}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        {form.errors.name && (
                            <div className="text-sm text-red-500">
                                {form.errors.name}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                        />
                        {form.errors.email && (
                            <div className="text-sm text-red-500">
                                {form.errors.email}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            New Password
                        </label>
                        <Input
                            type="password"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                        />
                        {form.errors.password && (
                            <div className="text-sm text-red-500">
                                {form.errors.password}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Email Verified
                        </label>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={form.data.email_verified}
                                onCheckedChange={(c) =>
                                    form.setData('email_verified', !!c)
                                }
                            />
                            <span className="text-sm">Mark as verified</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                            {roles.map((role) => (
                                <label
                                    key={role}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={form.data.roles.includes(role)}
                                        onCheckedChange={(c) =>
                                            toggleRole(role, c)
                                        }
                                    />
                                    <span>{role}</span>
                                </label>
                            ))}
                        </div>
                        {form.errors.roles && (
                            <div className="text-sm text-red-500">
                                {String(form.errors.roles)}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </div>
                </form>
            </Wrapper>
        </AppLayout>
    );
}
