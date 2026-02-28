import React from 'react';
import { cn } from '@/lib/utils';

export default function Wrapper({
    children,
    className,
    props,
}: {
    children: React.ReactNode;
    className?: string;
    props?: React.HTMLAttributes<HTMLDivElement>;
}) {
    return (
        <div
            className={cn(
                'flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
