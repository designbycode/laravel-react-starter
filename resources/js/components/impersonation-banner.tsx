import { router, usePage } from '@inertiajs/react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Auth } from '@/types';

export function ImpersonationBanner() {
    const page = usePage();
    const { auth, impersonating } = page.props as {
        auth: Auth;
        impersonating?: boolean;
    };

    const isImpersonating = Boolean(auth?.impersonating ?? impersonating);
    if (!isImpersonating) {
        return null;
    }

    const handleStopImpersonating = () => {
        // GET fallback route avoids CSRF issues and guarantees a plain URL string
        router.post('/admin/impersonate/stop');
    };

    return (
        <Alert
            variant="default"
            className="rounded-none border-x-0 border-t-0 bg-yellow-50 dark:bg-yellow-950"
        >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                <span className="font-medium">
                    You are currently impersonating {auth.user?.name}.
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopImpersonating}
                    className="ml-4"
                >
                    <X className="mr-2 h-4 w-4" />
                    Stop Impersonating
                </Button>
            </AlertDescription>
        </Alert>
    );
}
