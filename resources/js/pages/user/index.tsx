import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { buttonVariants, Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { Trash, Edit, Eye, Building2, User as UserIcon, Download, ExternalLink, MapPin, Phone, Calendar, Globe } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { ConfirmDialog } from '@/components/alert-dialog';
import { AlertDialog } from "@heroui/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface CompanyInfo {
    id: number;
    company_name: string | null;
    company_type: string | null;
    company_phone: string | null;
    company_address: string | null;
    business_category: string[] | null;
    sendcontact_link: string | null;
    zip_code: string | null;
    city: string | null;
    year_of_est: string | null;
    company_bio: string | null;
    status: string;
    image: string | null;
}

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: 'supplier' | 'buyer' | string;
    status: 'Active' | 'Inactive';
    created_at: string;
    company?: CompanyInfo[] | CompanyInfo | null;
    actions?: any;
}

interface PaginatedUsers {
    data: UserRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Filters {
    search?: string;
    role?: string;
    has_company?: string;
    per_page?: number;
}

interface Props {
    users: PaginatedUsers;
    filters: Filters;
}

const columns = [
    { label: 'Avatar', key: 'avatar' as const, sortable: false },
    { label: 'Name', key: 'name' as const, sortable: true },
    { label: 'Email', key: 'email' as const, sortable: true },
    { label: 'Phone', key: 'phone' as const, sortable: true },
    { label: 'Role', key: 'role' as const, sortable: true },
    { label: 'Status', key: 'status' as const, sortable: true },
    { label: 'Actions', key: 'actions' as const },
];

export default function Index({ users, filters }: Props) {
    const queryParams = new URLSearchParams(window.location.search);
    const search = queryParams.get('search') || '';
    const currentRole = queryParams.get('role') || 'all';
    const currentHasCompany = queryParams.get('has_company') || 'all';

    const deleteUser = (id: number) => {
        router.delete(route('user.destroy', id), {
            onSuccess: () => toast.success('User deleted successfully!'),
            onError: () => toast.error('Failed to delete user.'),
        });
    };

    const [pendingStatus, setPendingStatus] = useState<{ id: number; newStatus: string; oldStatus: string } | null>(null);
    const statusDialogTriggerRef = useRef<HTMLButtonElement>(null);
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

    useEffect(() => {
        if (pendingStatus) {
            statusDialogTriggerRef.current?.click();
        }
    }, [pendingStatus]);

    const confirmStatusChange = () => {
        if (!pendingStatus) return;
        const { id, newStatus } = pendingStatus;

        router.patch(route('user.updateStatus', id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Status updated to ${newStatus}!`);
                setPendingStatus(null);
            },
            onError: () => {
                toast.error('Failed to update status.');
                setPendingStatus(null);
            },
        });
    };

    const cancelStatusChange = () => {
        setPendingStatus(null);
    };

    const handleRoleTabChange = (val: string) => {
        const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        if (val === 'all') {
            delete params.role;
        } else {
            params.role = val;
        }
        delete params.page;
        router.get(window.location.pathname, params, { preserveState: true, replace: true });
    };

    const handleCompanyFilterChange = (val: string) => {
        const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        if (val === 'all') {
            delete params.has_company;
        } else {
            params.has_company = val;
        }
        delete params.page;
        router.get(window.location.pathname, params, { preserveState: true, replace: true });
    };

    const getFirstCompany = (user: UserRow | null): CompanyInfo | null => {
        if (!user || !user.company) return null;
        if (Array.isArray(user.company)) {
            return user.company.length > 0 ? user.company[0] : null;
        }
        return user.company;
    };

    const exportCsvUrl = () => {
        const params = new URLSearchParams();
        if (currentRole !== 'all') params.set('role', currentRole);
        if (currentHasCompany !== 'all') params.set('has_company', currentHasCompany);
        const q = params.toString();
        return route('user.exportCsv') + (q ? `?${q}` : '');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'User Management', href: '/user' }]}>
            <Head title="User Management" />

            <div className="m-5">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">User Management</h1>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage suppliers and buyers across the platform</p>
                            </div>
                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                {selectedKeys.length > 0 && (
                                    <ConfirmDialog
                                        title="Delete Selected Users?"
                                        description={`Are you sure you want to delete ${selectedKeys.length} users? This action cannot be undone.`}
                                        onConfirm={() => {
                                            router.post(route('user.bulkDestroy'), { ids: selectedKeys }, {
                                                onSuccess: () => {
                                                    toast.success('Selected users deleted successfully!');
                                                    setSelectedKeys([]);
                                                },
                                                onError: () => toast.error('Failed to delete users.'),
                                            });
                                        }}
                                        trigger={
                                            <AlertDialog.Trigger className={buttonVariants({ variant: 'destructive' })}>
                                                Delete Selected ({selectedKeys.length})
                                            </AlertDialog.Trigger>
                                        }
                                    />
                                )}
                                <a
                                    href={exportCsvUrl()}
                                    className={buttonVariants({ variant: 'outline', className: 'gap-1.5' })}
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </a>
                                <Link className={buttonVariants({ variant: 'default' })} href={route('user.create')}>
                                    Create User
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <Tabs value={currentRole} onValueChange={handleRoleTabChange}>
                                <TabsList>
                                    <TabsTrigger value="all">All Users</TabsTrigger>
                                    <TabsTrigger value="supplier" className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                                        Suppliers
                                    </TabsTrigger>
                                    <TabsTrigger value="buyer" className="flex items-center gap-1.5">
                                        <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                                        Buyers
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Company Filter:</span>
                                <Select value={currentHasCompany} onValueChange={handleCompanyFilterChange}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue placeholder="All Company Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="true">With Company Info</SelectItem>
                                        <SelectItem value="false">Without Company Info</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Table<UserRow>
                            data={users.data}
                            total={users.total}
                            currentPage={users.current_page}
                            rowsPerPage={users.per_page}
                            columns={columns}
                            searchableKeys={['name', 'email', 'phone']}
                            selectable={true}
                            selectedKeys={selectedKeys}
                            onSelectionChange={(keys) => setSelectedKeys(keys as number[])}
                            primaryKey="id"
                            renderCell={(key, value, row) => {
                                if (key === 'avatar') {
                                    return (
                                        <div className="w-10 h-10 overflow-hidden rounded-full flex items-center justify-center bg-gray-100 border">
                                            {row.avatar ? (
                                                <img
                                                    src={row.avatar.startsWith('http') ? row.avatar : `/${row.avatar}`}
                                                    alt={row.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {row.name ? row.name.slice(0, 2).toUpperCase() : 'U'}
                                                </span>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'role') {
                                    const roleStr = (row.role || '').toLowerCase();
                                    if (roleStr === 'supplier') {
                                        return (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                                <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                Supplier
                                            </span>
                                        );
                                    }
                                    return (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                                            <UserIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                            Buyer
                                        </span>
                                    );
                                }

                                if (key === 'status') {
                                    const getStatusColor = (status: string) => {
                                        switch (status.toLowerCase()) {
                                            case 'active':
                                                return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400';
                                            case 'inactive':
                                                return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400';
                                            default:
                                                return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300';
                                        }
                                    };

                                    const displayStatus = pendingStatus?.id === row.id ? pendingStatus.newStatus : row.status;

                                    return (
                                        <Select
                                            value={displayStatus}
                                            onValueChange={(val) => {
                                                if (val !== row.status) {
                                                    setPendingStatus({ id: row.id, newStatus: val, oldStatus: row.status });
                                                }
                                            }}
                                        >
                                            <SelectTrigger
                                                className={`h-8 w-[110px] px-3 py-1 rounded-full text-sm font-medium outline-none border-none cursor-pointer text-center ${getStatusColor(
                                                    displayStatus
                                                )} transition-colors ring-0 focus:ring-0 focus:ring-offset-0 shadow-none`}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-lg">
                                                <SelectItem
                                                    value="Active"
                                                    className="cursor-pointer rounded-lg px-4 py-2 font-medium focus:bg-green-100 focus:text-green-800 dark:focus:bg-green-900/30 dark:focus:text-green-400"
                                                >
                                                    Active
                                                </SelectItem>
                                                <SelectItem
                                                    value="Inactive"
                                                    className="cursor-pointer rounded-lg px-4 py-2 font-medium focus:bg-red-100 focus:text-red-800 dark:focus:bg-red-900/30 dark:focus:text-red-400"
                                                >
                                                    Inactive
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    );
                                }

                                if (key === 'actions') {
                                    return (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                title="View Details"
                                                className={buttonVariants({ variant: 'secondary', size: 'icon' })}
                                                onClick={() => setSelectedUser(row)}
                                            >
                                                <Eye className="w-4 h-4 text-emerald-500" />
                                            </button>
                                            <Link
                                                href={route('user.edit', row.id)}
                                                title="Edit User"
                                                className={buttonVariants({ variant: 'secondary', size: 'icon' })}
                                            >
                                                <Edit className="w-4 h-4 text-blue-500" />
                                            </Link>
                                            <ConfirmDialog
                                                title="Delete this User?"
                                                description="Are you sure you want to delete this User? This action cannot be undone."
                                                onConfirm={() => deleteUser(row.id)}
                                                trigger={
                                                    <AlertDialog.Trigger className={buttonVariants({ variant: 'secondary', size: 'icon' })}>
                                                        <Trash className="w-4 h-4 text-red-500" />
                                                    </AlertDialog.Trigger>
                                                }
                                            />
                                        </div>
                                    );
                                }

                                return value || '—';
                            }}
                            onPageChange={(page) => {
                                const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
                                router.get(window.location.pathname, {
                                    ...params,
                                    page,
                                }, { preserveState: true, replace: true });
                            }}
                            onPerPageChange={(perPage) => {
                                const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
                                router.get(window.location.pathname, {
                                    ...params,
                                    page: 1,
                                    per_page: perPage,
                                }, { preserveState: true, replace: true });
                            }}
                            onSearchChange={(searchVal) => {
                                const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
                                if (searchVal) {
                                    params.search = searchVal;
                                } else {
                                    delete params.search;
                                }
                                router.get(window.location.pathname, {
                                    ...params,
                                    page: 1,
                                }, { preserveState: true, replace: true });
                            }}
                            searchValue={search}
                        />
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                title="Change Status?"
                description={`Are you sure you want to change the status from ${pendingStatus?.oldStatus} to ${pendingStatus?.newStatus}?`}
                onConfirm={confirmStatusChange}
                confirmText="Change Status"
                confirmColor="primary"
                icon={<Edit className="size-5" />}
                trigger={
                    <AlertDialog.Trigger>
                        <button ref={statusDialogTriggerRef} className="hidden" />
                    </AlertDialog.Trigger>
                }
                onOpenChange={(isOpen) => {
                    if (!isOpen) cancelStatusChange();
                }}
            />

            {/* View User Details Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (() => {
                        const isSupplier = (selectedUser.role || '').toLowerCase() === 'supplier';
                        const company = getFirstCompany(selectedUser);

                        return (
                            <div className="space-y-6">
                                {/* Basic User Info Card */}
                                <div className="p-4 bg-muted/40 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border">
                                            {selectedUser.avatar ? (
                                                <img
                                                    src={selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `/${selectedUser.avatar}`}
                                                    alt={selectedUser.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-lg font-bold">
                                                    {selectedUser.name ? selectedUser.name.slice(0, 2).toUpperCase() : 'U'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold">{selectedUser.name}</h3>
                                                {isSupplier ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                        <Building2 className="w-3 h-3" /> Supplier
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                                        <UserIcon className="w-3 h-3" /> Buyer
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                            selectedUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {selectedUser.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border rounded-xl">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Phone</p>
                                        <p className="text-sm font-semibold">{selectedUser.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Role</p>
                                        <p className="text-sm font-semibold capitalize">{selectedUser.role}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Member Since</p>
                                        <p className="text-sm font-semibold">
                                            {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Company Information Section (Only for Suppliers) */}
                                {isSupplier ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-amber-500" />
                                                Company Information (Supplier Only)
                                            </h4>
                                            {company && (
                                                <Badge variant="outline" className="text-xs">
                                                    Status: {company.status}
                                                </Badge>
                                            )}
                                        </div>

                                        {company ? (
                                            <div className="p-4 border rounded-xl space-y-4 bg-card">
                                                <div className="flex items-center gap-3">
                                                    {company.image && (
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center shrink-0">
                                                            <img
                                                                src={company.image.startsWith('http') ? company.image : `/${company.image}`}
                                                                alt={company.company_name || 'Company'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h5 className="font-bold text-base">{company.company_name || 'Unnamed Company'}</h5>
                                                        <p className="text-xs text-muted-foreground">{company.company_type || 'Type not specified'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                    {company.company_phone && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span>{company.company_phone}</span>
                                                        </div>
                                                    )}
                                                    {(company.city || company.company_address) && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span>
                                                                {[company.company_address, company.city, company.zip_code].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {company.year_of_est && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span>Est. {company.year_of_est}</span>
                                                        </div>
                                                    )}
                                                    {company.sendcontact_link && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <a
                                                                href={company.sendcontact_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                            >
                                                                Mini Site <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {company.business_category && company.business_category.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Business Categories</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {company.business_category.map((cat, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                                    {cat}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {company.company_bio && (
                                                    <div className="pt-2 border-t">
                                                        <p className="text-xs font-semibold text-muted-foreground mb-1">About Company</p>
                                                        <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                                                            {company.company_bio}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 border border-dashed rounded-xl text-center bg-muted/20">
                                                <p className="text-sm text-muted-foreground">
                                                    No company information has been created yet for this supplier.
                                                </p>
                                                <Link
                                                    href={route('user.edit', selectedUser.id)}
                                                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-2' })}
                                                >
                                                    Add Company Info Now
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                        <UserIcon className="w-4 h-4 shrink-0 text-blue-500" />
                                        <span>Company information is only applicable for supplier accounts. Buyer accounts do not have company profiles.</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
