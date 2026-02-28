import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import Wrapper from '@/components/wrapper';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, store } from '@/routes/admin/users';

export default function AdminUsersCreate({ roles = [] }: { roles: string[] }) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        roles: [] as string[],
        email_verified: false,
        ban: { reason: '', until: '' as string | undefined },
    });

    const toggleRole = (role: string, checked: boolean | string) => {
        form.setData(
            'roles',
            checked
                ? [...form.data.roles, role]
                : form.data.roles.filter((r) => r !== role),
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(store());
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: dashboard() },
        { title: 'Users', href: usersIndex() },
        { title: 'Create', href: usersIndex() },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />
            <Wrapper>
                <Heading title="Create User" description="Create a new user. Optionally mark as verified or set an immediate ban." />
                <form onSubmit={submit} className="max-w-2xl space-y-6">
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
                        <label className="text-sm font-medium">Password</label>
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

                    <div className="space-y-2 border-t pt-4">
                        <label className="text-sm font-medium">
                            Immediate Ban (optional)
                        </label>
                        <div className="space-y-2">
                            <Input
                                placeholder="Reason"
                                value={form.data.ban.reason}
                                onChange={(e) =>
                                    form.setData('ban', {
                                        ...form.data.ban,
                                        reason: e.target.value,
                                    })
                                }
                            />
                            <Input
                                type="datetime-local"
                                placeholder="Until"
                                value={form.data.ban.until}
                                onChange={(e) =>
                                    form.setData('ban', {
                                        ...form.data.ban,
                                        until: e.target.value,
                                    })
                                }
                            />
                            {(form.errors as any)['ban.reason'] && (
                                <div className="text-sm text-red-500">
                                    {(form.errors as any)['ban.reason']}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={form.processing}>
                            Create
                        </Button>
                    </div>
                </form>
            </Wrapper>
        </AppLayout>
    );
}
