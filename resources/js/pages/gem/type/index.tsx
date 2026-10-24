import AppLayout from '@/layouts/app-layout';
import { PaginatedGemTypes, GemType } from '@/types';
import { Head, router, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Edit, Plus, Trash, ArrowUpDown } from 'lucide-react';
import { ConfirmDialog } from '@/components/alert-dialog';
import { AlertDialog } from "@heroui/react";
import { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    types: PaginatedGemTypes;
}

const columns = [
    { label: '#', key: 'id' as keyof GemType, sortable: false },
    { label: 'Name', key: 'name' as keyof GemType, sortable: true },
    { label: 'Sort Order', key: 'sort_order' as keyof GemType, sortable: true },
    { label: 'Status', key: 'status' as keyof GemType, sortable: true },
    { label: 'Created At', key: 'created_at' as keyof GemType, sortable: true },
    { label: 'Actions', key: 'actions' },
];

export default function Index({ types }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [pendingStatus, setPendingStatus] = useState<{ id: number; newStatus: string; oldStatus: string } | null>(null);

    const statusDialogTriggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (pendingStatus) {
            statusDialogTriggerRef.current?.click();
        }
    }, [pendingStatus]);

    const confirmStatusChange = () => {
        if (!pendingStatus) return;
        const { id, newStatus } = pendingStatus;

        router.patch(route('gem.types.updateStatus', id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Status updated successfully!', { id: 'app-flash-toast' });
                setPendingStatus(null);
            },
            onError: () => {
                toast.error('Failed to update status.');
                setPendingStatus(null);
            },
        });
    };

    const deleteGemType = (id: number) => {
        router.delete(route('gem.types.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Type deleted successfully!', { id: 'app-flash-toast' });
            },
            onError: () => {
                toast.error('Failed to delete Gem Type.');
            },
        });
    };

    const confirmBulkDelete = () => {
        if (selectedIds.length === 0) return;

        router.post(route('gem.types.bulkDestroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Selected Gem Types deleted successfully!', { id: 'app-flash-toast' });
                setSelectedIds([]);
            },
            onError: () => {
                toast.error('Failed to delete selected items.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Gem Management', href: '/gem/types' },
            { title: 'Gem Types', href: '/gem/types' },
        ]}>
            <Head title="Gem Types" />

            <div className="m-5">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Gem Types</h1>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage gem types across the platform</p>
                            </div>
                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                {selectedIds.length > 0 && (
                                    <ConfirmDialog
                                        title="Delete Selected Gem Types?"
                                        description={`Are you sure you want to delete ${selectedIds.length} selected gem types? This action cannot be undone.`}
                                        onConfirm={confirmBulkDelete}
                                        trigger={
                                            <AlertDialog.Trigger className={buttonVariants({ variant: 'destructive', className: 'flex items-center gap-1.5' })}>
                                                <Trash className="size-4" />
                                                Delete Selected ({selectedIds.length})
                                            </AlertDialog.Trigger>
                                        }
                                    />
                                )}
                                <Link
                                    href={route('gem.types.create')}
                                    className={buttonVariants({ variant: 'default', className: 'flex items-center gap-1.5' })}
                                >
                                    <Plus className="size-4" />
                                    Create Gem Type
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table<GemType>
                            data={types.data}
                            total={types.total}
                            currentPage={types.current_page}
                            rowsPerPage={types.per_page}
                            columns={columns}
                            searchableKeys={['name']}
                            selectable={true}
                            selectedKeys={selectedIds}
                            onSelectionChange={(keys) => setSelectedIds(keys as number[])}
                            onPageChange={(page) => {
                                router.get(route('gem.types.index'), { page }, { preserveState: true });
                            }}
                            onPerPageChange={(perPage) => {
                                router.get(route('gem.types.index'), { per_page: perPage }, { preserveState: true });
                            }}
                            onSearchChange={(search) => {
                                router.get(route('gem.types.index'), { search }, { preserveState: true });
                            }}
                            renderCell={(key, value, row, rowIndex) => {
                                if (key === 'id') {
                                    const serialNumber = (types.current_page - 1) * types.per_page + (rowIndex ?? 0) + 1;
                                    return <span className="font-medium text-gray-700 dark:text-gray-300">{serialNumber}</span>;
                                }

                                if (key === 'name') {
                                    return (
                                        <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                            {row.name}
                                        </span>
                                    );
                                }

                                if (key === 'sort_order') {
                                    return (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            <ArrowUpDown className="size-3 text-muted-foreground" />
                                            {row.sort_order}
                                        </span>
                                    );
                                }

                                if (key === 'status') {
                                    const getStatusColor = (status: string) => {
                                        switch (status.toLowerCase()) {
                                            case 'active': return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400';
                                            case 'inactive': return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400';
                                            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300';
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
                                            <SelectTrigger className={`h-8 w-[110px] px-3 py-1 rounded-full text-sm font-medium outline-none border-none cursor-pointer text-center ${getStatusColor(displayStatus)} transition-colors ring-0 focus:ring-0 focus:ring-offset-0 shadow-none`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 shadow-lg">
                                                <SelectItem value="active" className="cursor-pointer rounded-lg px-4 py-2 font-medium focus:bg-green-100 focus:text-green-800 dark:focus:bg-green-900/30 dark:focus:text-green-400">
                                                    Active
                                                </SelectItem>
                                                <SelectItem value="inactive" className="cursor-pointer rounded-lg px-4 py-2 font-medium focus:bg-red-100 focus:text-red-800 dark:focus:bg-red-900/30 dark:focus:text-red-400">
                                                    Inactive
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    );
                                }

                                if (key === 'created_at') {
                                    return (
                                        <span className="text-gray-500 text-sm whitespace-nowrap">
                                            {new Date(row.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    );
                                }

                                if (key === 'actions') {
                                    return (
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Link
                                                href={route('gem.types.edit', row.id)}
                                                className={buttonVariants({ variant: 'secondary', size: 'icon' })}
                                            >
                                                <Edit className="size-4" />
                                            </Link>
                                            <ConfirmDialog
                                                title="Delete Gem Type?"
                                                description="This action cannot be undone. Are you sure you want to delete this gem type?"
                                                onConfirm={() => deleteGemType(row.id)}
                                                trigger={
                                                    <AlertDialog.Trigger className={buttonVariants({ variant: 'destructive', size: 'icon' })}>
                                                        <Trash className="size-4" />
                                                    </AlertDialog.Trigger>
                                                }
                                            />
                                        </div>
                                    );
                                }

                                return value;
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Status Confirm Dialog */}
            <ConfirmDialog
                title="Change Gem Type Status?"
                description={`Are you sure you want to change the status to ${pendingStatus?.newStatus}?`}
                onConfirm={confirmStatusChange}
                confirmText="Yes, Change"
                confirmColor="primary"
                icon={<ArrowUpDown className="size-5" />}
                trigger={
                    <AlertDialog.Trigger>
                        <button ref={statusDialogTriggerRef} className="hidden" />
                    </AlertDialog.Trigger>
                }
                onOpenChange={(isOpen) => {
                    if (!isOpen) setPendingStatus(null);
                }}
            />
        </AppLayout>
    );
}
