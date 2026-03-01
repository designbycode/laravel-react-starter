import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props;

    const hasPermission = (permission: string): boolean => {
        return auth.permissions?.includes(permission) ?? false;
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some((permission) => hasPermission(permission));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every((permission) => hasPermission(permission));
    };

    const hasRole = (role: string): boolean => {
        return auth.user?.roles?.some((r) => r.name === role) ?? false;
    };

    const hasAnyRole = (roles: string[]): boolean => {
        return roles.some((role) => hasRole(role));
    };

    const isAdmin = (): boolean => {
        return hasRole('admin');
    };

    const isModerator = (): boolean => {
        return hasRole('moderator');
    };

    const isImpersonating = (): boolean => {
        return auth.is_impersonating ?? false;
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        isAdmin,
        isModerator,
        isImpersonating,
    };
}
