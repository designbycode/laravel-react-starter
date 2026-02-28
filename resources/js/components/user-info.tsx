import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
    useEffect(() => {
        // Bump cache-buster when the avatar URL changes
        setCacheBuster(Date.now());
    }, [user?.avatar_url, user?.avatar]);
    const getInitials = useInitials();

    const baseUrl = user?.avatar_url ?? user?.avatar ?? undefined;
    const displayUrl = useMemo(() => {
        return baseUrl
            ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}v=${cacheBuster}`
            : undefined;
    }, [baseUrl, cacheBuster]);

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={displayUrl} alt={user.name} key={String(cacheBuster)} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
