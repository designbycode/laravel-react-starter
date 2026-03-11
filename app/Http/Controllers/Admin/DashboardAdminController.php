<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardAdminController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $periodDays = 14;

        // Immediate lightweight counts
        $usersCount = User::query()->count();

        // Helpers
        $daysRange = fn (int $startDaysAgo, int $length): \Illuminate\Support\Collection => collect(range($length - 1, 0))->reverse()->map(
            fn (int $i): string => now()->subDays($startDaysAgo + ($length - 1 - $i))->toDateString()
        );

        $buildSeries = function (\Illuminate\Database\Eloquent\Builder $builder, string $dateColumn, int $length, int $startDaysAgo = 0, ?string $distinctColumn = null): array {
            $days = collect(range($length - 1, 0))->map(fn (int $i): string => now()->subDays($startDaysAgo + ($length - 1 - $i))->toDateString());
            $countExpr = $distinctColumn ? ('COUNT(DISTINCT '.$distinctColumn.')') : 'COUNT(*)';

            $counts = (clone $builder)
                ->selectRaw('DATE('.$dateColumn.') as date, '.$countExpr.' as count')
                ->where($dateColumn, '>=', now()->subDays($startDaysAgo + $length - 1)->startOfDay())
                ->where($dateColumn, '<=', now()->subDays($startDaysAgo)->endOfDay())
                ->groupBy('date')
                ->orderBy('date')
                ->pluck('count', 'date');

            return $days->map(fn (string $d): int => (int) ($counts[$d] ?? 0))->values()->all();
        };

        $sum = fn (array $xs): int => array_sum($xs);
        $trend = function (int $curr, int $prev): float {
            $den = max($prev, 1);

            return (($curr - $prev) / $den) * 100.0;
        };

        // Active users via activity log (distinct causer_id per day, limited to User causers)
        $activeUsersBuilder = \Spatie\Activitylog\Models\Activity::query()
            ->whereNotNull('causer_id')
            ->where('causer_type', User::class);

        // Roles & permissions builders
        $roleBuilder = \Spatie\Permission\Models\Role::query();
        $permissionBuilder = \Spatie\Permission\Models\Permission::query();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users' => $usersCount,
                'users_series' => Inertia::lazy(function () use ($buildSeries, $sum, $trend, $periodDays): array {
                    $current = $buildSeries(User::query(), 'created_at', $periodDays, 0);
                    $previous = $buildSeries(User::query(), 'created_at', $periodDays, $periodDays);

                    return [
                        'series' => $current,
                        'trend_percent' => $trend($sum($current), $sum($previous)),
                    ];
                }),

                'active_users' => Inertia::lazy(function () use ($activeUsersBuilder, $buildSeries, $sum, $trend, $periodDays): array {
                    $current = $buildSeries((clone $activeUsersBuilder), 'created_at', $periodDays, 0, 'causer_id');
                    $previous = $buildSeries((clone $activeUsersBuilder), 'created_at', $periodDays, $periodDays, 'causer_id');

                    return [
                        'value' => $sum($current),
                        'series' => $current,
                        'trend_percent' => $trend($sum($current), $sum($previous)),
                    ];
                }),

                'roles' => $roleBuilder->count(),
                'roles_series' => Inertia::lazy(function () use ($roleBuilder, $buildSeries, $sum, $trend, $periodDays): array {
                    $current = $buildSeries($roleBuilder, 'created_at', $periodDays, 0);
                    $previous = $buildSeries($roleBuilder, 'created_at', $periodDays, $periodDays);

                    return [
                        'series' => $current,
                        'trend_percent' => $trend($sum($current), $sum($previous)),
                    ];
                }),

                'permissions' => $permissionBuilder->count(),
                'permissions_series' => Inertia::lazy(function () use ($permissionBuilder, $buildSeries, $sum, $trend, $periodDays): array {
                    $current = $buildSeries($permissionBuilder, 'created_at', $periodDays, 0);
                    $previous = $buildSeries($permissionBuilder, 'created_at', $periodDays, $periodDays);

                    return [
                        'series' => $current,
                        'trend_percent' => $trend($sum($current), $sum($previous)),
                    ];
                }),
            ],
        ]);
    }
}
