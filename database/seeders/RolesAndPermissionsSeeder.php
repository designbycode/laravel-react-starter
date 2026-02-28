<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Define permissions
        $permissions = [
            // User management permissions
            'view users',
            'create users',
            'edit users',
            'delete users',
            'impersonate users',
            'assign roles',
            'remove roles',

            // Role management permissions
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            'assign permissions to roles',

            // Permission management permissions
            'view permissions',
            'create permissions',
            'edit permissions',
            'delete permissions',

            // Dashboard permissions
            'view dashboard',
            'view admin dashboard',

            // Post management permissions
            'view posts',
            'create posts',
            'edit posts',
            'delete posts',
            'publish posts',
            'edit own posts',
            'delete own posts',

            // Comment management permissions
            'view comments',
            'create comments',
            'edit comments',
            'delete comments',
            'moderate comments',
            'edit own comments',
            'delete own comments',

            // Category management permissions
            'view categories',
            'create categories',
            'edit categories',
            'delete categories',

            // Media management permissions
            'view media',
            'upload media',
            'delete media',
            'delete own media',

            // Settings permissions
            'view settings',
            'edit settings',
            'view system settings',
            'manage system settings',

            // Activity log permissions
            'view activity log',
            'delete activity log',

            // Backup permissions
            'view backups',
            'create backups',
            'download backups',
            'delete backups',
            'manage backup schedule',
        ];

        // Create permissions for both web and api guards
        $guards = ['web', 'api'];
        foreach ($guards as $guard) {
            foreach ($permissions as $permission) {
                Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => $guard,
                ]);
            }
        }

        // Define roles and their permissions (web guard)
        $roles = [
            'admin' => Permission::where('guard_name', 'web')->pluck('name')->toArray(), // Admin gets all permissions
            'moderator' => [
                'view users',
                'edit users',
                'view dashboard',
                'view admin dashboard',
                'view posts',
                'create posts',
                'edit posts',
                'delete posts',
                'publish posts',
                'view comments',
                'create comments',
                'edit comments',
                'delete comments',
                'moderate comments',
                'view categories',
                'create categories',
                'edit categories',
                'view media',
                'upload media',
                'delete media',
                'view activity log',
            ],
            'user' => [
                'view dashboard',
                'view posts',
                'create posts',
                'edit own posts',
                'delete own posts',
                'view comments',
                'create comments',
                'edit own comments',
                'delete own comments',
                'view categories',
                'view media',
                'upload media',
                'delete own media',
            ],
        ];

        // Create roles and assign permissions
        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($rolePermissions);
        }

        $this->command->info('Permissions and roles seeded successfully!');
    }
}
