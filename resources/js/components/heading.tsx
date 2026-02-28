import type { ReactNode } from 'react';

export default function Heading({
    title,
    description,
    variant = 'default',
    action,
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    action?: ReactNode;
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-6'}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2
                        className={
                            variant === 'small'
                                ? 'mb-0.5 text-base font-medium'
                                : 'text-xl font-semibold tracking-tight'
                        }
                    >
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </header>
    );
}
