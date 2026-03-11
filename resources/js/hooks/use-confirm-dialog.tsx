import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type ConfirmOptions = {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
};

export function useConfirmDialog() {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({});
    const [resolver, setResolver] = useState<null | ((v: boolean) => void)>(
        null,
    );

    const confirm = (opts?: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setOptions({
                title: 'Are you sure?',
                description: 'This action cannot be undone.',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                variant: 'default',
                ...(opts ?? {}),
            });
            setResolver(() => resolve);
            setOpen(true);
        });
    };

    const handleClose = (result: boolean) => {
        if (resolver) {
            resolver(result);
        }
        setOpen(false);
        setResolver(null);
    };

    const ConfirmDialog = (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleClose(false);
                else setOpen(v);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                        className={
                            options.variant === 'destructive'
                                ? 'text-destructive'
                                : undefined
                        }
                    >
                        {options.title}
                    </DialogTitle>
                    {options.description ? (
                        <DialogDescription>
                            {options.description}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleClose(false)}
                    >
                        {options.cancelText ?? 'Cancel'}
                    </Button>
                    <Button
                        type="button"
                        variant={
                            options.variant === 'destructive'
                                ? 'destructive'
                                : 'default'
                        }
                        onClick={() => handleClose(true)}
                    >
                        {options.confirmText ?? 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return { confirm, ConfirmDialog } as const;
}

export default useConfirmDialog;
