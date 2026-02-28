import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function AdminUsersIndex() {
    return (
        <AppLayout>
            <Head title="Users Index" />
            <h1>Users</h1>
        </AppLayout>
    );
}
