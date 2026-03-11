'use client';

import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface StatSimpleProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: { value: number; label: string };
    className?: string;
}

export default function StatSimple({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
}: StatSimpleProps) {
    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_var(--cosmic-glow)]',
                className,
            )}
        >
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                        {title}
                    </span>
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                        {value}
                    </span>
                    {description && (
                        <span className="text-xs text-muted-foreground">
                            {description}
                        </span>
                    )}
                </div>
                {Icon && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>{title}</TooltipContent>
                    </Tooltip>
                )}
            </div>
            {trend && (
                <div className="relative mt-4 flex items-center gap-1.5">
                    <span
                        className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                            trend.value >= 0
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400',
                        )}
                        aria-label={`Trend: ${trend.value >= 0 ? 'up' : 'down'} ${Math.abs(trend.value)}%`}
                    >
                        {trend.value >= 0 ? '+' : ''}
                        {trend.value}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {trend.label}
                    </span>
                </div>
            )}
        </div>
    );
}
