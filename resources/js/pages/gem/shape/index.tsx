import AppLayout from '@/layouts/app-layout';
import { PaginatedGemShapes, GemShape } from '@/types';
import { Head, router, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Edit, Plus, Trash, ArrowUpDown, ImageIcon } from 'lucide-react';
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
    shapes: PaginatedGemShapes;
}

const columns = [
    { label: '#', key: 'id' as keyof GemShape, sortable: false },
    { label: 'Shape Cut', key: 'image' as keyof GemShape, sortable: false },
    { label: 'Shape Name', key: 'name' as keyof GemShape, sortable: true },
    { label: 'Sort Order', key: 'sort_order' as keyof GemShape, sortable: true },
    { label: 'Status', key: 'status' as keyof GemShape, sortable: true },
    { label: 'Created At', key: 'created_at' as keyof GemShape, sortable: true },
    { label: 'Actions', key: 'actions' },
];

export default function Index({ shapes }: Props) {
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

        router.patch(route('gem.shapes.updateStatus', id), { status: newStatus }, {
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

    const deleteGemShape = (id: number) => {
        router.delete(route('gem.shapes.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Shape deleted successfully!', { id: 'app-flash-toast' });
            },
            onError: () => {
                toast.error('Failed to delete Gem Shape.');
            },
        });
    };

    const confirmBulkDelete = () => {
        if (selectedIds.length === 0) return;

        router.post(route('gem.shapes.bulkDestroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Selected Gem Shapes deleted successfully!', { id: 'app-flash-toast' });
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
            { title: 'Gem Shapes', href: '/gem/shapes' },
        ]}>
            <Head title="Gem Shapes" />

            <div className="m-5">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Gem Shapes</h1>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage gem shapes across the platform</p>
                            </div>
                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                {selectedIds.length > 0 && (
                                    <ConfirmDialog
                                        title="Delete Selected Gem Shapes?"
                                        description={`Are you sure you want to delete ${selectedIds.length} selected gem shapes? This action will delete the shape cut images and records permanently.`}
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
                                    href={route('gem.shapes.create')}
                                    className={buttonVariants({ variant: 'default', className: 'flex items-center gap-1.5' })}
                                >
                                    <Plus className="size-4" />
                                    Create Gem Shape
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table<GemShape>
                            data={shapes.data}
                            total={shapes.total}
                            currentPage={shapes.current_page}
                            rowsPerPage={shapes.per_page}
                            columns={columns}
                            searchableKeys={['name']}
                            selectable={true}
                            selectedKeys={selectedIds}
                            onSelectionChange={(keys) => setSelectedIds(keys as number[])}
                            onPageChange={(page) => {
                                router.get(route('gem.shapes.index'), { page }, { preserveState: true });
                            }}
                            onPerPageChange={(perPage) => {
                                router.get(route('gem.shapes.index'), { per_page: perPage }, { preserveState: true });
                            }}
                            onSearchChange={(search) => {
                                router.get(route('gem.shapes.index'), { search }, { preserveState: true });
                            }}
                            renderCell={(key, value, row, rowIndex) => {
                                if (key === 'id') {
                                    const serialNumber = (shapes.current_page - 1) * shapes.per_page + (rowIndex ?? 0) + 1;
                                    return <span className="font-medium text-gray-700 dark:text-gray-300">{serialNumber}</span>;
                                }

                                if (key === 'image') {
                                    return row.full_image_path ? (
                                        <div className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-1 shadow-xs shrink-0">
                                            <img
                                                src={row.full_image_path}
                                                alt={row.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground bg-muted/40 shrink-0">
                                            <ImageIcon className="size-4" />
                                        </div>
                                    );
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
                                                href={route('gem.shapes.edit', row.id)}
                                                className={buttonVariants({ variant: 'secondary', size: 'icon' })}
                                            >
                                                <Edit className="size-4" />
                                            </Link>
                                            <ConfirmDialog
                                                title="Delete Gem Shape?"
                                                description="This action will delete the shape cut image and record permanently."
                                                onConfirm={() => deleteGemShape(row.id)}
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
                title="Change Gem Shape Status?"
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
