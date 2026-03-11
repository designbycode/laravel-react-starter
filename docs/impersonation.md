# User Impersonation: End-to-End Guide

This guide explains the complete user impersonation workflow implemented in this repository and how to clone it into a new Laravel 12 + Inertia v2 (React 19) project. It also includes an appendix on using the lab404/laravel-impersonate package APIs as an alternative.

Quick Checklist (with copy-paste blocks below)
- Backend
    - Routes: POST /admin/impersonate/{user}, POST /admin/impersonate/stop (auth+verified; start additionally requires role:admin)
    - Controller: App/Http/Controllers/Admin/ImpersonationController (start, stop)
    - Middleware: HandleInertiaRequests shares auth.is_impersonating
    - AuthZ: role:admin middleware protects start; stop is available when session flag exists
    - Activity log: spatie/laravel-activitylog entries written on start/stop
- Frontend
    - Banner: resources/js/components/impersonation-banner.tsx
    - Layout wiring: resources/js/layouts/app/app-sidebar-layout.tsx (renders banner)
    - Admin Users pages initiate start: resources/js/pages/admin/users/{index,show}.tsx
    - Wayfinder TS routes/actions: resources/js/routes/admin/impersonate and actions controller
    - use-permissions hook consumes shared props
- Tests: tests/Feature/Admin/ImpersonationTest.php
- Packages: spatie/laravel-permission, spatie/laravel-activitylog, inertiajs/inertia-laravel, lab404/laravel-impersonate (optional)

1) Overview
   User impersonation lets an authorized administrator temporarily assume another user’s identity to debug or assist. This implementation is session-based:
- When starting impersonation: store the original user’s UUID in session, then Auth::login(target)
- While impersonating: an Inertia-shared flag shows a prominent banner with a Stop button
- When stopping: Auth::login(original), clear the session flag
- Security: Only admins can start impersonation; anyone with the flag set can stop
- Audit: Activity is logged on start and stop

2) Prerequisites & Packages
   Run these commands in a fresh project:

```bash
composer require inertiajs/inertia-laravel spatie/laravel-permission spatie/laravel-activitylog
# Optional package variant covered in Appendix A
composer require lab404/laravel-impersonate --dev

# Install frontend deps if not already
bun i # or npm i / pnpm i / yarn
```

Publish and migrate Spatie Permission (if not already set up):
```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

Ensure your composer.json includes versions similar to:
- "laravel/framework": "^12.0"
- "inertiajs/inertia-laravel": "^2.0"
- "spatie/laravel-permission": "^7.1"
- "spatie/laravel-activitylog": "^4.11"
- "lab404/laravel-impersonate": "^1.7" (optional; appendix shows usage)
- Frontend: @inertiajs/react v2, React 19, Wayfinder for TS route helpers

3) Backend (Exact Implementation)
   3.1 Routes (routes/admin.php)
   Protected by auth + verified. Admin-only group (role:admin) wraps start; stop route is above it.
   Copy-paste into routes/admin.php (adjust imports):

```php
<?php

use App\Http\Controllers\Admin\ImpersonationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('admin')->name('admin.')->group(function () {
        // Stop impersonation – defined before wildcard route
        Route::post('/impersonate/stop', [ImpersonationController::class, 'stop'])->name('impersonate.stop');

        // Admin-only
        Route::middleware(['role:admin'])->group(function () {
            Route::post('/impersonate/{user}', [ImpersonationController::class, 'start'])->name('impersonate.start');
        });
    });
});
```

3.2 Controller (app/Http/Controllers/Admin/ImpersonationController.php)
Copy-paste this controller (namespaces/imports included):

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use function activity;

class ImpersonationController extends Controller
{
    /**
     * Start impersonating a user.
     */
    public function start(Request $request, User $user): RedirectResponse
    {
        $originalUser = Auth::user();

        // Prevent impersonating yourself
        if ($originalUser->uuid === $user->uuid) {
            return back()->with('error', 'You cannot impersonate yourself.');
        }

        // Store the original user ID in session
        session(['impersonate_original_user' => $originalUser->uuid]);

        // Login as the target user
        Auth::login($user);

        activity()
            ->performedOn($user)
            ->causedBy($originalUser)
            ->log('Started impersonating user');

        return redirect()->route('dashboard')->with('success', "You are now impersonating {$user->name}.");
    }

    /**
     * Stop impersonating and return to original user.
     */
    public function stop(Request $request): RedirectResponse
    {
        $originalUserId = session('impersonate_original_user');

        if (! $originalUserId) {
            return back()->with('error', 'You are not impersonating anyone.');
        }

        // Get the original user
        $originalUser = User::findOrFail($originalUserId);

        // Remove impersonation session
        session()->forget('impersonate_original_user');

        activity()
            ->causedBy($originalUser)
            ->log('Stopped impersonating user');

        // Login back as the original user
        Auth::login($originalUser);

        return redirect()->route('admin.users.index')->with('success', 'Stopped impersonating.');
    }
}
```

3.3 Shared Inertia Props (app/Http/Middleware/HandleInertiaRequests.php)
Add this share block (adjust to your app’s existing share method):

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user?->load('roles'),
                'permissions' => $user?->getAllPermissions()->pluck('name') ?? collect(),
                'is_impersonating' => session()->has('impersonate_original_user'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
```

3.4 Authorization & Roles
- Start route is protected by middleware role:admin (Spatie Permission)
- Seeder provides roles/permissions (database/seeders/RolesAndPermissionsSeeder.php), including 'impersonate users' permission for future variants

3.5 Activity Logging
- spatie/laravel-activitylog is used to record 'Started impersonating user' and 'Stopped impersonating user'

4) Frontend (Exact Implementation)
   4.1 Banner (resources/js/components/impersonation-banner.tsx)
   Copy-paste this component:

```tsx
import { router } from '@inertiajs/react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';

export function ImpersonationBanner() {
  const { isImpersonating } = usePermissions();
  if (!isImpersonating()) {
    return null;
  }
  return (
    <Alert variant="default" className="rounded-none border-x-0 border-t-0 bg-yellow-50 dark:bg-yellow-950">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="font-medium">You are currently impersonating another user.</span>
        <Button variant="outline" size="sm" onClick={() => router.post('/admin/impersonate/stop')} className="ml-4">
          <X className="mr-2 h-4 w-4" /> Stop Impersonating
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

4.2 Banner Placement (resources/js/layouts/app/app-sidebar-layout.tsx)
Add the banner to your layout:

```tsx
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ImpersonationBanner } from '@/components/impersonation-banner';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
  return (
    <AppShell variant="sidebar">
      <AppSidebar />
      <AppContent variant="sidebar" className="overflow-x-hidden">
        <ImpersonationBanner />
        <AppSidebarHeader breadcrumbs={breadcrumbs} />
        {children}
      </AppContent>
    </AppShell>
  );
}
```

4.3 Triggering Impersonation from Admin Users UI
Index page and Show page both provide an Impersonate action that POSTs to Wayfinder-generated start route.
Copy one of these snippets:

Index variant:
```tsx
import { router } from '@inertiajs/react';
import { start as impersonateStart } from '@/routes/admin/impersonate';

function handleImpersonate(user: { uuid: string; name: string }) {
  if (confirm(`You will be logged in as ${user.name}. Continue?`)) {
    router.post(impersonateStart.url({ uuid: user.uuid }));
  }
}
```

Show variant (using generated action controller):
```tsx
import { router } from '@inertiajs/react';
import ImpersonationController from '@/actions/App/Http/Controllers/Admin/ImpersonationController';

function handleImpersonate(user: { uuid: string; name: string }) {
  router.post(ImpersonationController.start.url({ uuid: user.uuid }));
}
```

4.4 Wayfinder TS Routes/Actions
Copy either of these files if you use Wayfinder:

routes variant (resources/js/routes/admin/impersonate/index.ts):
```ts
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from '@/routes/wayfinder';

export const stop = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({ url: stop.url(options), method: 'post' });
stop.definition = { methods: ['post'], url: '/admin/impersonate/stop' } as const;
stop.url = (options?: RouteQueryOptions) => stop.definition.url + queryParams(options);
stop.post = (options?: RouteQueryOptions) => ({ url: stop.url(options), method: 'post' as const });
const stopForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({ action: stop.url(options), method: 'post' });
stopForm.post = (options?: RouteQueryOptions) => ({ action: stop.url(options), method: 'post' as const });
stop.form = stopForm;

export const start = (
  args: { user: string | { uuid: string } } | [user: string | { uuid: string }] | string | { uuid: string },
  options?: RouteQueryOptions
): RouteDefinition<'post'> => ({ url: start.url(args, options), method: 'post' });
start.definition = { methods: ['post'], url: '/admin/impersonate/{user}' } as const;
start.url = (args: any, options?: RouteQueryOptions) => {
  if (typeof args === 'string' || typeof args === 'number') args = { user: args };
  if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) args = { user: args.uuid };
  if (Array.isArray(args)) args = { user: args[0] };
  args = applyUrlDefaults(args);
  const parsed = { user: typeof args.user === 'object' ? args.user.uuid : args.user };
  return start.definition.url.replace('{user}', parsed.user.toString()).replace(/\/+$/, '') + queryParams(options);
};
start.post = (args: any, options?: RouteQueryOptions) => ({ url: start.url(args, options), method: 'post' as const });
const startForm = (args: any, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({ action: start.url(args, options), method: 'post' });
startForm.post = (args: any, options?: RouteQueryOptions) => ({ action: start.url(args, options), method: 'post' as const });
start.form = startForm;
export default { stop: Object.assign(stop, stop), start: Object.assign(start, start) };
```

actions controller variant (resources/js/actions/App/Http/Controllers/Admin/ImpersonationController.ts):
```ts
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from '@/actions/wayfinder';
export const stop = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({ url: stop.url(options), method: 'post' });
stop.definition = { methods: ['post'], url: '/admin/impersonate/stop' } as const;
stop.url = (options?: RouteQueryOptions) => stop.definition.url + queryParams(options);
stop.post = (options?: RouteQueryOptions) => ({ url: stop.url(options), method: 'post' as const });
const stopForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({ action: stop.url(options), method: 'post' });
stopForm.post = (options?: RouteQueryOptions) => ({ action: stop.url(options), method: 'post' as const });
stop.form = stopForm;

export const start = (
  args: { user: string | { uuid: string } } | [user: string | { uuid: string }] | string | { uuid: string },
  options?: RouteQueryOptions
): RouteDefinition<'post'> => ({ url: start.url(args, options), method: 'post' });
start.definition = { methods: ['post'], url: '/admin/impersonate/{user}' } as const;
start.url = (args: any, options?: RouteQueryOptions) => {
  if (typeof args === 'string' || typeof args === 'number') args = { user: args };
  if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) args = { user: args.uuid };
  if (Array.isArray(args)) args = { user: args[0] };
  args = applyUrlDefaults(args);
  const parsed = { user: typeof args.user === 'object' ? args.user.uuid : args.user };
  return start.definition.url.replace('{user}', parsed.user.toString()).replace(/\/+$/, '') + queryParams(options);
};
start.post = (args: any, options?: RouteQueryOptions) => ({ url: start.url(args, options), method: 'post' as const });
const startForm = (args: any, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({ action: start.url(args, options), method: 'post' });
startForm.post = (args: any, options?: RouteQueryOptions) => ({ action: start.url(args, options), method: 'post' as const });
start.form = startForm;
const ImpersonationController = { stop, start };
export default ImpersonationController;
```

4.5 use-permissions Hook
- Consumes Inertia shared props (roles, permissions, is_impersonating)

```ts
const isImpersonating = () => auth.is_impersonating ?? false;
```

5) Database & Seeding
- Use RolesAndPermissionsSeeder to create roles 'admin', 'moderator', 'user'
- Admin gets all permissions; permission 'impersonate users' exists for optional gating

6) Tests
   Copy this feature test and adapt namespaces/model keys if needed:

```php
<?php

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertAuthenticatedAs;

it('admin can start impersonating user', function () {
    $admin = $this->createUserWithRole('admin');
    $user = $this->createUserWithRole('user');

    actingAs($admin)
        ->post(route('admin.impersonate.start', $user))
        ->assertRedirect(route('dashboard'));

    assertAuthenticatedAs($user);
    expect(session('impersonate_original_user'))->toBe($admin->uuid);
});

it('admin cannot impersonate themselves', function () {
    $admin = $this->createUserWithRole('admin');

    actingAs($admin)
        ->post(route('admin.impersonate.start', $admin))
        ->assertRedirect()
        ->assertSessionHas('error');

    assertAuthenticatedAs($admin);
    expect(session()->has('impersonate_original_user'))->toBeFalse();
});

it('non-admin cannot impersonate user', function () {
    $user = $this->createUserWithRole('user');
    $otherUser = $this->createUserWithRole('user');

    actingAs($user)
        ->post(route('admin.impersonate.start', $otherUser))
        ->assertForbidden();
});

it('admin can stop impersonating', function () {
    $admin = $this->createUserWithRole('admin');
    $user = $this->createUserWithRole('user');

    actingAs($user)->withSession(['impersonate_original_user' => $admin->uuid])
        ->post('/admin/impersonate/stop')
        ->assertRedirect(route('admin.users.index'));

    assertAuthenticatedAs($admin);
    expect(session()->has('impersonate_original_user'))->toBeFalse();
});

it('activity is logged when impersonation starts', function () {
    $admin = $this->createUserWithRole('admin');
    $user = $this->createUserWithRole('user');

    actingAs($admin)->post(route('admin.impersonate.start', $user));

    $this->assertDatabaseHas('activity_log', [
        'subject_type' => 'App\\Models\\User',
        'subject_id' => $user->uuid,
        'causer_type' => 'App\\Models\\User',
        'causer_id' => $admin->uuid,
        'description' => 'Started impersonating user',
    ]);
});

it('activity is logged when impersonation stops', function () {
    $admin = $this->createUserWithRole('admin');
    $user = $this->createUserWithRole('user');

    actingAs($user)->withSession(['impersonate_original_user' => $admin->uuid]);

    $this->post(route('admin.impersonate.stop'));

    $this->assertDatabaseHas('activity_log', [
        'causer_type' => 'App\\Models\\User',
        'causer_id' => $admin->uuid,
        'description' => 'Stopped impersonating user',
    ]);
});
```

Run:
```bash
php artisan test --compact --filter=Impersonation
```

7) Step-by-Step: Clone Into a New Project
   A. Install and configure packages
```bash
composer require inertiajs/inertia-laravel spatie/laravel-permission spatie/laravel-activitylog
# Optional (Appendix A)
composer require lab404/laravel-impersonate --dev
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

B. Add routes
Copy into routes/admin.php:
```php
// See section 3.1 for full snippet
```

C. Add controller
Create app/Http/Controllers/Admin/ImpersonationController.php:
```php
// See section 3.2 for full snippet
```

D. Share impersonation flag
Update app/Http/Middleware/HandleInertiaRequests.php:
```php
// See section 3.3 for full snippet
```

E. Frontend wiring
Create resources/js/components/impersonation-banner.tsx and add to your layout:
```tsx
// See sections 4.1 and 4.2 for full snippets
```
Add impersonate buttons:
```tsx
// See section 4.3 for full snippets
```
If using Wayfinder, create routes/actions:
```ts
// See section 4.4 for full snippets
```

F. Roles & seeding
- Ensure an admin role exists and your admin user has role:admin
- Optionally add a distinct 'impersonate users' permission and gate via middleware(['permission:impersonate users'])

G. Tests
Create tests/Feature/Admin/ImpersonationTest.php:
```php
// See section 6 for full snippet
```
Run:
```bash
php artisan test --compact --filter=Impersonation
```

8) Appendix A: Using lab404/laravel-impersonate APIs Instead
   If you prefer to leverage lab404 helpers, your controller can be simplified:

- Configure the package (vendor publishes not strictly needed for defaults). Ensure the trait/middleware are available.
- Start impersonation (example):

```php
public function start(Request $request, User $user)
{
    $admin = Auth::user();
    if ($admin->id === $user->id) return back()->with('error', 'You cannot impersonate yourself.');
    app('impersonate')->take($admin, $user); // or $admin->impersonate($user)
    return redirect()->route('dashboard');
}
```

- Stop impersonation:

```php
public function stop(Request $request)
{
    if (app('impersonate')->isImpersonating()) {
        app('impersonate')->leave(); // or Auth::user()->leaveImpersonation()
        return redirect()->route('admin.users.index');
    }
    return back();
}
```

- Banner flag: you can derive from app('impersonate')->isImpersonating() (store in session or share directly in middleware)
- Authorization: keep role:admin for start; allow anyone impersonating to call stop
- Optional: Use package middleware ProtectFromImpersonation on sensitive routes

9) Optional Enhancements & Variations
- Permission-based gating: Replace role:admin with middleware(['permission:impersonate users'])
- Limit targets: Prevent impersonating admins or banned users
- Audit: Store the original user uuid alongside current user in activity properties
- Notifications: Notify the impersonated user or security team when impersonation starts
- UX: Show the target username in the banner; add persistent fixed-top banner styling; require confirmation dialogs
- Rate limiting: throttle start/stop endpoints

10) References
- Controller: app/Http/Controllers/Admin/ImpersonationController.php
- Routes: routes/admin.php (impersonate.start, impersonate.stop)
- Inertia middleware: app/Http/Middleware/HandleInertiaRequests.php
- Banner: resources/js/components/impersonation-banner.tsx
- Layout: resources/js/layouts/app/app-sidebar-layout.tsx
- Admin UI: resources/js/pages/admin/users/index.tsx, show.tsx
- Wayfinder TS: resources/js/routes/admin/impersonate/index.ts, actions/App/Http/Controllers/Admin/ImpersonationController.ts
- Seeder: database/seeders/RolesAndPermissionsSeeder.php
- Tests: tests/Feature/Admin/ImpersonationTest.php
- Packages: spatie/laravel-permission, spatie/laravel-activitylog, lab404/laravel-impersonate
