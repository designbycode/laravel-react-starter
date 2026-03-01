import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    ChevronsLeft,
    ChevronsRight,
    MoreVertical,
    Eye,
    Pencil,
    Trash2,
    RotateCcw,
    Ban,
    ShieldCheck,
    UserCog,
    UserPlus, // used as impersonate icon fallback
    Search,
    X,
} from 'lucide-react';
import * as React from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Wrapper from '@/components/wrapper';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/admin';
import {
    assignRole,
    ban as banRoute,
    bulk as bulkRoute,
    create,
    destroy,
    edit,
    index as usersIndex,
    restore,
    show,
    unban,
} from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';
// Wayfinder route helper for impersonate not generated; fallback to literal POST path
const impersonate = (uuid: string) => `/admin/users/${uuid}/impersonate`;

type User = {
    id: number;
    uuid: string;
    name: string;
    email: string;
    avatar?: string | null;
    avatar_url?: string | null;
    roles?: { name: string }[];
    email_verified_at?: string | null;
    is_banned?: boolean;
    deleted_at?: string | null;
};

export default function AdminUsersIndex({
    users,
    filters,
    roles = [],
    can,
}: {
    users: any;
    filters: any;
    roles: string[];
    can: any;
}) {
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search ?? '',
        role: filters?.role ?? '',
        status: filters?.status ?? '',
        email_verified: filters?.email_verified ?? '',
        page: filters?.page ?? 1,
        per_page: filters?.per_page ?? 25,
        sort: filters?.sort ?? '',
        direction: filters?.direction ?? 'asc',
    });

    const data = React.useMemo(() => users?.data ?? [], [users?.data]);
    const [rowSelection, setRowSelection] = React.useState<
        Record<string, boolean>
    >({});

    const [banUser, setBanUser] = React.useState<User | null>(null);
    const [confirmDeleteUser, setConfirmDeleteUser] =
        React.useState<User | null>(null);
    const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);
    const [banReason, setBanReason] = React.useState('');
    const [banUntil, setBanUntil] = React.useState<string | undefined>('');

    const [roleUser, setRoleUser] = React.useState<User | null>(null);
    const [roleValue, setRoleValue] = React.useState('');

    const columns = React.useMemo<ColumnDef<User>[]>(
        () => [
            {
                id: 'select',
                header: () => (
                    <div className="w-px">
                        <Checkbox
                            checked={
                                Object.keys(rowSelection).length ===
                                    data.length && data.length > 0
                            }
                            onCheckedChange={(checked) => {
                                const next: Record<string, boolean> = {};
                                if (checked) {
                                    for (const u of data) next[u.id] = true;
                                }
                                setRowSelection(next);
                            }}
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="w-px">
                        <Checkbox
                            checked={rowSelection[(row.original as User).id]}
                            onCheckedChange={(c) => {
                                const id = (row.original as User).id;
                                setRowSelection((s) => ({ ...s, [id]: !!c }));
                            }}
                        />
                    </div>
                ),
                size: 32,
            },
            {
                id: 'user',
                header: () => (
                    <div className="flex items-center gap-1">
                        <span>User</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            aria-label="Sort by user"
                            onClick={() => {
                                setLocalFilters((f) => ({
                                    ...f,
                                    sort: 'name',
                                    direction:
                                        f.direction === 'asc' ? 'desc' : 'asc',
                                    page: 1,
                                }));
                                submitFilters();
                            }}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </div>
                ),
                cell: ({ row }) => {
                    const u = row.original as User;
                    const url = u.avatar_url || u.avatar || undefined;
                    const initials = (u.name || '?')
                        .split(' ')
                        .map((p) => p[0] || '')
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                    return (
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={url} alt={u.name} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                                <div className="font-medium">{u.name}</div>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'email',
                header: () => (
                    <div className="flex items-center gap-1">
                        <span>Email</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            aria-label="Sort by email"
                            onClick={() => {
                                setLocalFilters((f) => ({
                                    ...f,
                                    sort: 'email',
                                    direction:
                                        f.direction === 'asc' ? 'desc' : 'asc',
                                    page: 1,
                                }));
                                submitFilters();
                            }}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
            {
                accessorKey: 'roles',
                header: 'Roles',
                cell: ({ row }) => {
                    const roles = (row.original.roles || []) as { name: string }[];
                    const roleVariant = (n: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
                        const name = n.toLowerCase();
                        if (name === 'admin' || name === 'owner' || name === 'superadmin') return 'destructive';
                        if (name === 'manager' || name === 'maintainer') return 'default';
                        if (name === 'editor' || name === 'moderator') return 'secondary';
                        return 'outline';
                    };
                    return (
                        <div className="flex flex-wrap gap-1">
                            {roles.length === 0 ? (
                                <Badge variant="outline">none</Badge>
                            ) : (
                                roles.map((r) => (
                                    <Badge key={r.name} variant={roleVariant(r.name)} className="capitalize">
                                        {r.name}
                                    </Badge>
                                ))
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'verified',
                header: 'Verified',
                cell: ({ row }) =>
                    row.original.email_verified_at ? (
                        <Badge className="bg-emerald-500 text-emerald-50 border-transparent">Verified</Badge>
                    ) : (
                        <Badge variant="secondary">Unverified</Badge>
                    ),
            },
            {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const u = row.original as User;
                    if (u.deleted_at) {
                        return <Badge variant="destructive">Deleted</Badge>;
                    }
                    if (u.is_banned) {
                        return <Badge variant="secondary">Banned</Badge>;
                    }
                    return <Badge variant="default">Active</Badge>;
                },
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                cell: ({ row }) => {
                    const u = row.original as User;
                    return (
                        <div className="flex min-w-0 justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Actions"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="min-w-44"
                                >
                                    <DropdownMenuItem onClick={() => router.get(show(u.uuid))}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </DropdownMenuItem>
                                    {can?.edit && (
                                        <DropdownMenuItem onClick={() => router.get(edit(u.uuid))}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {can?.delete && !u.deleted_at && (
                                        <DropdownMenuItem onClick={() => setConfirmDeleteUser(u)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete…
                                        </DropdownMenuItem>
                                    )}
                                    {can?.delete && u.deleted_at && (
                                        <DropdownMenuItem onClick={() => router.post(restore(u.uuid))}>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Restore
                                        </DropdownMenuItem>
                                    )}
                                    {!u.deleted_at && (
                                        <>
                                            <DropdownMenuSeparator />
                                            {!u.is_banned && can?.edit && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setBanUser(u);
                                                        setBanReason('');
                                                        setBanUntil('');
                                                    }}
                                                >
                                                    <Ban className="mr-2 h-4 w-4" />
                                                    Ban…
                                                </DropdownMenuItem>
                                            )}
                                            {u.is_banned && can?.edit && (
                                                <DropdownMenuItem onClick={() => router.post(unban(u.uuid))}>
                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                    Unban
                                                </DropdownMenuItem>
                                            )}
                                            {can?.assign_roles && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setRoleUser(u);
                                                        setRoleValue('');
                                                    }}
                                                >
                                                    <UserCog className="mr-2 h-4 w-4" />
                                                    Assign role…
                                                </DropdownMenuItem>
                                            )}
                                            {can?.impersonate && (
                                                <DropdownMenuItem onClick={() => router.post(impersonate(u.uuid))}>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Impersonate
                                                </DropdownMenuItem>
                                            )}
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        [data, rowSelection, can],
    );

    const table = useReactTable({
        data,
        columns,
        state: { rowSelection },
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
    });

    const selectedIds = React.useMemo(
        () =>
            Object.entries(rowSelection)
                .filter(([, v]) => v)
                .map(([k]) => Number(k)),
        [rowSelection],
    );

    const normalize = (f: typeof localFilters) => ({
        ...f,
        status: f.status === 'any' ? '' : f.status,
        email_verified: f.email_verified === 'any' ? '' : f.email_verified,
        role: f.role === 'any' ? '' : f.role,
        sort: f['sort'] || undefined,
        direction: f['direction'] || undefined,
    });

    const clearFilter = (
        key: 'search' | 'role' | 'status' | 'email_verified',
    ) => {
        setLocalFilters((f) => ({ ...f, [key]: '', page: 1 }));
    };

    const initialSearch = React.useRef(true);
    React.useEffect(() => {
        if (initialSearch.current) {
            initialSearch.current = false;
            return;
        }
        const id = setTimeout(() => submitFilters(), 400);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localFilters.search]);

    const submitFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            usersIndex({ mergeQuery: normalize(localFilters) }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    React.useEffect(() => {
        // Auto-submit when per_page changes
        submitFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localFilters.per_page]);

    React.useEffect(() => {
        // Auto-submit when select-based filters or sort change
        submitFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        localFilters.role,
        localFilters.status,
        localFilters.email_verified,
        localFilters.sort,
        localFilters.direction,
    ]);

    const bulk = (action: string, role?: string) => {
        if (selectedIds.length === 0) return;
        router.post(
            bulkRoute(),
            { action, ids: selectedIds, role },
            { preserveScroll: true },
        );
    };

    const doBan = () => {
        if (!banUser) return;
        router.post(
            banRoute(banUser!.uuid),
            { reason: banReason, until: banUntil || null },
            {
                onSuccess: () => setBanUser(null),
                preserveScroll: true,
            },
        );
    };

    const doAssignRole = () => {
        if (!roleUser || !roleValue) return;
        router.post(
            assignRole(roleUser!.uuid),
            { role: roleValue },
            {
                onSuccess: () => setRoleUser(null),
                preserveScroll: true,
            },
        );
    };

    const clearSelection = () => setRowSelection({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: dashboard() },
        { title: 'Users', href: usersIndex() },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <Wrapper>
                <Heading
                    title="Users"
                    description="Manage users, roles, verification, bans, and access. Use filters to quickly find people."
                    variant="default"
                    action={
                        can?.create ? (
                            <Link href={create()}>
                                <Button size="sm">New</Button>
                            </Link>
                        ) : null
                    }
                />

                {/* Filter toolbar */}
                <div className="mb-3 flex flex-wrap items-end gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="h-9 w-72 pl-8"
                            placeholder="Search name or email"
                            value={localFilters.search}
                            type={`search`}
                            onChange={(e) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    search: e.target.value,
                                }))
                            }
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <Select
                            value={localFilters.role}
                            onValueChange={(v) =>
                                setLocalFilters((f) => ({ ...f, role: v }))
                            }
                        >
                            <SelectTrigger className="h-9 min-w-32">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any role</SelectItem>
                                {roles.map((r) => (
                                    <SelectItem
                                        className={`capitalize`}
                                        key={r}
                                        value={r}
                                    >
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div>
                        <Select
                            value={localFilters.status}
                            onValueChange={(v) =>
                                setLocalFilters((f) => ({ ...f, status: v }))
                            }
                        >
                            <SelectTrigger className="h-9 min-w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="banned">Banned</SelectItem>
                                <SelectItem value="deleted">Deleted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Verified */}
                    <div>
                        <Select
                            value={localFilters.email_verified}
                            onValueChange={(v) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    email_verified: v,
                                }))
                            }
                        >
                            <SelectTrigger className="h-9 min-w-32">
                                <SelectValue placeholder="Verified" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reset button moved next to Verified */}
                    <Button
                        className="ml-0 h-9"
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setLocalFilters({
                                search: '',
                                role: '',
                                status: '',
                                email_verified: '',
                                page: 1,
                                per_page: 25,
                                sort: '',
                                direction: 'asc',
                            });
                            submitFilters();
                        }}
                    >
                        <X className={`size-4`} />
                        <span className={`sr-only`}>Reset</span>
                    </Button>

                    {/* Spacer */}
                    <div className="grow" />

                    {/* Per page */}
                    <div>
                        <Select
                            value={String(localFilters.per_page)}
                            onValueChange={(v) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    per_page: Number(v || 25),
                                }))
                            }
                        >
                            <SelectTrigger className="h-9 min-w-28">
                                <SelectValue placeholder="Per page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Actions removed - Apply/Reset not needed here */}
                </div>

                {/* Active filters */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {localFilters.search && (
                        <Badge variant="secondary" className="pr-1">
                            Search: {localFilters.search}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="ml-1 h-5 w-5"
                                onClick={() => clearFilter('search')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                    {localFilters.role && localFilters.role !== 'any' && (
                        <Badge variant="secondary" className="pr-1">
                            Role: {localFilters.role}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="ml-1 h-5 w-5"
                                onClick={() => clearFilter('role')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                    {localFilters.status && localFilters.status !== 'any' && (
                        <Badge variant="secondary" className="pr-1">
                            Status: {localFilters.status}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="ml-1 h-5 w-5"
                                onClick={() => clearFilter('status')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                    {localFilters.email_verified &&
                        localFilters.email_verified !== 'any' && (
                            <Badge variant="secondary" className="pr-1">
                                Verified: {localFilters.email_verified}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="ml-1 h-5 w-5"
                                    onClick={() =>
                                        clearFilter('email_verified')
                                    }
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )}
                    {!localFilters.search &&
                        (!localFilters.role || localFilters.role === 'any') &&
                        (!localFilters.status ||
                            localFilters.status === 'any') &&
                        (!localFilters.email_verified ||
                            localFilters.email_verified === 'any') && (
                            <span className="text-sm text-muted-foreground">
                                No active filters
                            </span>
                        )}
                </div>

                {selectedIds.length > 0 && (
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="text-sm">
                            Selected: {selectedIds.length}
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setConfirmBulkDelete(true)}
                        >
                            Delete
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => bulk('restore')}
                        >
                            Restore
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => bulk('ban')}
                        >
                            Ban
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => bulk('unban')}
                        >
                            Unban
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="secondary">
                                    Assign role…
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Assign role to selected
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex gap-2">
                                    <Select
                                        value={roleValue || 'any'}
                                        onValueChange={(v) =>
                                            setRoleValue(v === 'any' ? '' : v)
                                        }
                                    >
                                        <SelectTrigger className="min-w-48">
                                            <SelectValue placeholder="Choose a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">
                                                Choose a role
                                            </SelectItem>
                                            {roles.map((r) => (
                                                <SelectItem
                                                    className={`capitalize`}
                                                    key={r}
                                                    value={r}
                                                >
                                                    {r}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={() => {
                                            if (!roleValue) return;
                                            bulk('assign-role', roleValue);
                                            setRoleValue('');
                                        }}
                                        disabled={!roleValue}
                                    >
                                        Assign
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearSelection}
                        >
                            Clear
                        </Button>
                    </div>
                )}

                <div className="w-full overflow-x-auto rounded border">
                    <table className="w-full">
                        <thead>
                            {table.getHeaderGroups().map((hg) => (
                                <tr key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="border-t">
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-3 py-2 text-sm"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-0 flex items-center justify-center gap-2">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationLink
                                    aria-label="First"
                                    onClick={() =>
                                        router.get(
                                            usersIndex({
                                                mergeQuery: {
                                                    ...normalize(localFilters),
                                                    page: 1,
                                                },
                                            }),
                                            {},
                                            { preserveState: true },
                                        )
                                    }
                                    data-disabled={users?.current_page <= 1}
                                >
                                    <ChevronsLeft className={`text-lg`} />
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        router.get(
                                            usersIndex({
                                                mergeQuery: {
                                                    ...normalize(localFilters),
                                                    page:
                                                        users.current_page - 1,
                                                },
                                            }),
                                            {},
                                            { preserveState: true },
                                        )
                                    }
                                    data-disabled={users?.current_page <= 1}
                                />
                            </PaginationItem>
                            {(() => {
                                const current = users?.current_page ?? 1;
                                const last = users?.last_page ?? 1;
                                const start = Math.max(1, current - 3);
                                const end = Math.min(last, current + 3);
                                const pages: number[] = [];
                                for (let p = start; p <= end; p++)
                                    pages.push(p);
                                const items = [] as React.ReactNode[];
                                if (start > 1) {
                                    items.push(
                                        <PaginationItem key="start-ellipsis">
                                            <PaginationEllipsis />
                                        </PaginationItem>,
                                    );
                                }
                                for (const page of pages) {
                                    items.push(
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                isActive={page === current}
                                                onClick={() =>
                                                    router.get(
                                                        usersIndex({
                                                            mergeQuery: {
                                                                ...normalize(
                                                                    localFilters,
                                                                ),
                                                                page,
                                                            },
                                                        }),
                                                        {},
                                                        { preserveState: true },
                                                    )
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>,
                                    );
                                }
                                if (end < last) {
                                    items.push(
                                        <PaginationItem key="end-ellipsis">
                                            <PaginationEllipsis />
                                        </PaginationItem>,
                                    );
                                }
                                return items;
                            })()}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        router.get(
                                            usersIndex({
                                                mergeQuery: {
                                                    ...normalize(localFilters),
                                                    page:
                                                        users.current_page + 1,
                                                },
                                            }),
                                            {},
                                            { preserveState: true },
                                        )
                                    }
                                    data-disabled={
                                        users?.current_page >= users?.last_page
                                    }
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink
                                    aria-label="Last"
                                    onClick={() =>
                                        router.get(
                                            usersIndex({
                                                mergeQuery: {
                                                    ...normalize(localFilters),
                                                    page: users.last_page,
                                                },
                                            }),
                                            {},
                                            { preserveState: true },
                                        )
                                    }
                                    data-disabled={
                                        users?.current_page >= users?.last_page
                                    }
                                >
                                    <ChevronsRight className={`text-lg`} />
                                </PaginationLink>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </Wrapper>

            <Dialog
                open={!!confirmDeleteUser}
                onOpenChange={(o) => {
                    if (!o) setConfirmDeleteUser(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete {confirmDeleteUser?.name}?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            This action will soft-delete the user. You can
                            restore them later.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmDeleteUser(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (confirmDeleteUser) {
                                        router.delete(
                                            destroy(confirmDeleteUser.uuid),
                                            {
                                                onSuccess: () =>
                                                    setConfirmDeleteUser(null),
                                                preserveScroll: true,
                                            },
                                        );
                                    }
                                }}
                            >
                                Confirm delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={confirmBulkDelete}
                onOpenChange={(o) => {
                    if (!o) setConfirmBulkDelete(false);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete {selectedIds.length} selected user(s)?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            This action will soft-delete the selected users. You
                            can restore them later.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmBulkDelete(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setConfirmBulkDelete(false);
                                    bulk('delete');
                                }}
                                disabled={selectedIds.length === 0}
                            >
                                Confirm delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!banUser}
                onOpenChange={(o) => {
                    if (!o) setBanUser(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ban {banUser?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm">Reason</label>
                            <Input
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Enter reason"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">
                                Until (optional)
                            </label>
                            <Input
                                type="datetime-local"
                                value={banUntil}
                                onChange={(e) => setBanUntil(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setBanUser(null)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={doBan} disabled={!banReason}>
                                Confirm ban
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!roleUser}
                onOpenChange={(o) => {
                    if (!o) setRoleUser(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Assign role to {roleUser?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <Select
                            value={roleValue || 'any'}
                            onValueChange={(v) =>
                                setRoleValue(v === 'any' ? '' : v)
                            }
                        >
                            <SelectTrigger className="min-w-48">
                                <SelectValue placeholder="Choose a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">
                                    Choose a role
                                </SelectItem>
                                {roles.map((r) => (
                                    <SelectItem
                                        className={`capitalize`}
                                        key={r}
                                        value={r}
                                    >
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={doAssignRole} disabled={!roleValue}>
                            Assign
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
