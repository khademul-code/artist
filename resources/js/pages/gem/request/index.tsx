import AppLayout from '@/layouts/app-layout';
import { PaginatedGemRequests, GemRequest, GemRequestStatus } from '@/types';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Eye,
    Trash,
    ImageIcon,
    Gem,
    Clock,
    Activity,
    CheckCircle2,
    Ban,
    User as UserIcon,
    Calendar,
    Layers,
    Shapes,
    Palette,
    FileText,
    ExternalLink
} from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Props {
    requests: PaginatedGemRequests;
    statusCounts: {
        all: number;
        pending: number;
        in_progress: number;
        completed: number;
        withdrawn: number;
    };
    filters?: {
        search?: string;
        status?: string;
        per_page?: number;
    };
}

const columns = [
    { label: '#', key: 'id', sortable: false },
    { label: 'Request #', key: 'request_number', sortable: true },
    { label: 'Buyer', key: 'user', sortable: false },
    { label: 'Gem Type', key: 'gem_type', sortable: false },
    { label: 'Shape & Color', key: 'specs', sortable: false },
    { label: 'Qty & Size', key: 'quantity', sortable: true },
    { label: 'Status', key: 'status', sortable: true },
    { label: 'Reference Image', key: 'reference_image', sortable: false },
    { label: 'Requested Date', key: 'created_at', sortable: true },
    { label: 'Actions', key: 'actions' },
];

export default function Index({ requests, statusCounts, filters }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [pendingStatus, setPendingStatus] = useState<{ id: number; newStatus: GemRequestStatus; oldStatus: GemRequestStatus } | null>(null);
    const [viewingRequest, setViewingRequest] = useState<GemRequest | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const statusDialogTriggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (pendingStatus) {
            statusDialogTriggerRef.current?.click();
        }
    }, [pendingStatus]);

    const activeStatus = filters?.status || '';

    const handleFilterStatus = (status: string) => {
        router.get(route('gem.requests.index'), {
            ...filters,
            status: status || undefined,
            page: 1,
        }, { preserveState: true });
    };

    const confirmStatusChange = () => {
        if (!pendingStatus) return;
        const { id, newStatus } = pendingStatus;

        router.patch(route('gem.requests.updateStatus', id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Status updated successfully!', { id: 'app-flash-toast' });
                if (viewingRequest?.id === id) {
                    setViewingRequest((prev) => prev ? { ...prev, status: newStatus } : null);
                }
                setPendingStatus(null);
            },
            onError: () => {
                toast.error('Failed to update status.');
                setPendingStatus(null);
            },
        });
    };

    const deleteGemRequest = (id: number) => {
        router.delete(route('gem.requests.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Request deleted successfully!', { id: 'app-flash-toast' });
                if (viewingRequest?.id === id) {
                    setViewingRequest(null);
                }
            },
            onError: () => {
                toast.error('Failed to delete Gem Request.');
            },
        });
    };

    const confirmBulkDelete = () => {
        if (selectedIds.length === 0) return;

        router.post(route('gem.requests.bulkDestroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Selected Gem Requests deleted successfully!', { id: 'app-flash-toast' });
                setSelectedIds([]);
            },
            onError: () => {
                toast.error('Failed to delete selected items.');
            },
        });
    };

    const getStatusBadge = (status: GemRequestStatus) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pending',
                    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                    dotClass: 'bg-amber-500',
                };
            case 'in_progress':
                return {
                    label: 'In Progress',
                    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                    dotClass: 'bg-blue-500',
                };
            case 'completed':
                return {
                    label: 'Completed',
                    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                    dotClass: 'bg-emerald-500',
                };
            case 'withdrawn':
                return {
                    label: 'Withdrawn',
                    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
                    dotClass: 'bg-rose-500',
                };
            default:
                return {
                    label: status,
                    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
                    dotClass: 'bg-gray-400',
                };
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Gem Requests', href: '/gem/requests' },
        ]}>
            <Head title="Gem Requests" />

            <div className="m-5 space-y-5">
                {/* Status Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* All */}
                    <button
                        type="button"
                        onClick={() => handleFilterStatus('')}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                            activeStatus === ''
                                ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20'
                                : 'bg-card border-border hover:bg-muted/40 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">All Requests</span>
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <Gem className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                            {statusCounts.all}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Total submissions</p>
                    </button>

                    {/* Pending */}
                    <button
                        type="button"
                        onClick={() => handleFilterStatus('pending')}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                            activeStatus === 'pending'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                                : 'bg-card border-border hover:bg-muted/40 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Pending</span>
                            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-300">
                            {statusCounts.pending}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting review</p>
                    </button>

                    {/* In Progress */}
                    <button
                        type="button"
                        onClick={() => handleFilterStatus('in_progress')}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                            activeStatus === 'in_progress'
                                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                                : 'bg-card border-border hover:bg-muted/40 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">In Progress</span>
                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                <Activity className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-300">
                            {statusCounts.in_progress}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Being processed</p>
                    </button>

                    {/* Completed */}
                    <button
                        type="button"
                        onClick={() => handleFilterStatus('completed')}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                            activeStatus === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                                : 'bg-card border-border hover:bg-muted/40 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Completed</span>
                            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300">
                            {statusCounts.completed}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Fulfilled requests</p>
                    </button>

                    {/* Withdrawn */}
                    <button
                        type="button"
                        onClick={() => handleFilterStatus('withdrawn')}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                            activeStatus === 'withdrawn'
                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 shadow-xs ring-1 ring-rose-500/30'
                                : 'bg-card border-border hover:bg-muted/40 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Withdrawn</span>
                            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                                <Ban className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-rose-800 dark:text-rose-300">
                            {statusCounts.withdrawn}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Cancelled by buyer</p>
                    </button>
                </div>

                {/* Main Card & Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    Gem Requests
                                    {activeStatus && (
                                        <Badge variant="outline" className="text-xs font-normal capitalize">
                                            Filtered: {activeStatus.replace('_', ' ')}
                                        </Badge>
                                    )}
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Monitor and manage custom gem customization requests submitted by buyers
                                </p>
                            </div>
                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                {selectedIds.length > 0 && (
                                    <ConfirmDialog
                                        title="Delete Selected Gem Requests?"
                                        description={`Are you sure you want to delete ${selectedIds.length} selected requests? This action cannot be undone.`}
                                        onConfirm={confirmBulkDelete}
                                        trigger={
                                            <AlertDialog.Trigger className={buttonVariants({ variant: 'destructive', className: 'flex items-center gap-1.5' })}>
                                                <Trash className="size-4" />
                                                Delete Selected ({selectedIds.length})
                                            </AlertDialog.Trigger>
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table<GemRequest>
                            data={requests.data}
                            total={requests.total}
                            currentPage={requests.current_page}
                            rowsPerPage={requests.per_page}
                            columns={columns}
                            searchableKeys={['request_number', 'size', 'request_details']}
                            selectable={true}
                            selectedKeys={selectedIds}
                            onSelectionChange={(keys) => setSelectedIds(keys as number[])}
                            onPageChange={(page) => {
                                router.get(route('gem.requests.index'), { ...filters, page }, { preserveState: true });
                            }}
                            onPerPageChange={(perPage) => {
                                router.get(route('gem.requests.index'), { ...filters, per_page: perPage, page: 1 }, { preserveState: true });
                            }}
                            onSearchChange={(search) => {
                                router.get(route('gem.requests.index'), { ...filters, search, page: 1 }, { preserveState: true });
                            }}
                            renderCell={(key, value, row, rowIndex) => {
                                if (key === 'id') {
                                    const serialNumber = (requests.current_page - 1) * requests.per_page + (rowIndex ?? 0) + 1;
                                    return <span className="font-medium text-gray-700 dark:text-gray-300">{serialNumber}</span>;
                                }

                                if (key === 'request_number') {
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => setViewingRequest(row)}
                                            className="font-mono text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            #{row.request_number}
                                        </button>
                                    );
                                }

                                if (key === 'user') {
                                    const buyer = row.user;
                                    return (
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden border border-border">
                                                {buyer?.avatar ? (
                                                    <img src={buyer.avatar} alt={buyer?.name || 'User'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{buyer?.name ? buyer.name.charAt(0).toUpperCase() : 'U'}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate max-w-[150px]">
                                                    {buyer?.name || 'Unknown Buyer'}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {buyer?.email || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }

                                if (key === 'gem_type') {
                                    const typeName = row.gem_type?.name || row.gemType?.name || 'Custom';
                                    return (
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Layers className="size-3.5 text-muted-foreground" />
                                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                                {typeName}
                                            </span>
                                        </div>
                                    );
                                }

                                if (key === 'specs') {
                                    const shapeName = row.gem_shape?.name || row.gemShape?.name;
                                    const colorName = row.gem_color?.name || row.gemColor?.name;
                                    const shapeImg = row.gem_shape?.full_image_path || row.gemShape?.full_image_path;
                                    const colorImg = row.gem_color?.full_image_path || row.gemColor?.full_image_path;

                                    return (
                                        <div className="flex flex-col gap-1 text-xs">
                                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                                {shapeImg ? (
                                                    <img src={shapeImg} alt={shapeName} className="size-3.5 object-contain" />
                                                ) : (
                                                    <Shapes className="size-3 text-muted-foreground" />
                                                )}
                                                <span>{shapeName || 'Any Shape'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                {colorImg ? (
                                                    <img src={colorImg} alt={colorName} className="size-3.5 rounded-full object-cover" />
                                                ) : (
                                                    <Palette className="size-3 text-muted-foreground" />
                                                )}
                                                <span>{colorName || 'Any Color'}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                if (key === 'quantity') {
                                    return (
                                        <div className="flex flex-col gap-0.5 text-xs whitespace-nowrap">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                                Qty: <span className="font-bold">{row.quantity}</span>
                                            </span>
                                            <span className="text-muted-foreground text-[11px]">
                                                Size: {row.size || 'Not specified'}
                                            </span>
                                        </div>
                                    );
                                }

                                if (key === 'status') {
                                    const badge = getStatusBadge(row.status);
                                    const displayStatus = pendingStatus?.id === row.id ? pendingStatus.newStatus : row.status;

                                    return (
                                        <div className="flex flex-col gap-1">
                                            <Select
                                                value={displayStatus}
                                                onValueChange={(val) => {
                                                    if (val !== row.status) {
                                                        setPendingStatus({
                                                            id: row.id,
                                                            newStatus: val as GemRequestStatus,
                                                            oldStatus: row.status,
                                                        });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={`h-7 px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer ${badge.badgeClass} ring-0 focus:ring-0 focus:ring-offset-0 shadow-none`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`size-1.5 rounded-full ${badge.dotClass}`} />
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border bg-popover p-1 shadow-lg">
                                                    <SelectItem value="pending" className="cursor-pointer text-xs">
                                                        Pending
                                                    </SelectItem>
                                                    <SelectItem value="in_progress" className="cursor-pointer text-xs">
                                                        In Progress
                                                    </SelectItem>
                                                    <SelectItem value="completed" className="cursor-pointer text-xs">
                                                        Completed
                                                    </SelectItem>
                                                    <SelectItem value="withdrawn" className="cursor-pointer text-xs text-rose-600">
                                                        Withdrawn
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {row.status === 'withdrawn' && row.withdrawn_at && (
                                                <span className="text-[10px] text-rose-500 whitespace-nowrap">
                                                    Withdrawn: {new Date(row.withdrawn_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'reference_image') {
                                    const imgUrl = row.reference_image_url || (row.reference_image ? `/${row.reference_image}` : null);
                                    return imgUrl ? (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewImage(imgUrl)}
                                            className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-1 shadow-xs shrink-0 cursor-pointer hover:border-primary transition-colors group relative"
                                            title="Click to view full reference image"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt="Reference"
                                                className="w-full h-full object-cover rounded"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                                <Eye className="size-3 text-white" />
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground/60 bg-muted/20 shrink-0" title="No reference image">
                                            <ImageIcon className="size-4" />
                                        </div>
                                    );
                                }

                                if (key === 'created_at') {
                                    return (
                                        <span className="text-gray-500 text-xs whitespace-nowrap">
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
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => setViewingRequest(row)}
                                                title="View Full Details"
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <ConfirmDialog
                                                title="Delete Gem Request?"
                                                description="Are you sure you want to delete this buyer gem request? This action cannot be undone."
                                                onConfirm={() => deleteGemRequest(row.id)}
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
                title="Change Request Status?"
                description={`Are you sure you want to update request #${pendingStatus?.id} status from ${pendingStatus?.oldStatus?.replace('_', ' ')} to ${pendingStatus?.newStatus?.replace('_', ' ')}?`}
                onConfirm={confirmStatusChange}
                confirmText="Yes, Change"
                confirmColor="primary"
                icon={<Activity className="size-5" />}
                trigger={
                    <AlertDialog.Trigger>
                        <button ref={statusDialogTriggerRef} className="hidden" />
                    </AlertDialog.Trigger>
                }
                onOpenChange={(isOpen) => {
                    if (!isOpen) setPendingStatus(null);
                }}
            />

            {/* Request Detail Modal */}
            <Dialog open={!!viewingRequest} onOpenChange={(open) => !open && setViewingRequest(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
                    <DialogHeader className="border-b pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <Gem className="size-5 text-primary" />
                                    Gem Request #{viewingRequest?.request_number}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Slug: {viewingRequest?.slug}
                                </DialogDescription>
                            </div>
                            {viewingRequest && (
                                <Badge className={getStatusBadge(viewingRequest.status).badgeClass}>
                                    {getStatusBadge(viewingRequest.status).label}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    {viewingRequest && (
                        <div className="space-y-5 pt-2">
                            {/* Buyer Information Section */}
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                                    <UserIcon className="size-3.5" /> Buyer Information
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Name</span>
                                        <span className="font-medium text-foreground">{viewingRequest.user?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Email</span>
                                        <span className="font-medium text-foreground">{viewingRequest.user?.email || 'N/A'}</span>
                                    </div>
                                    {viewingRequest.user?.phone && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Phone</span>
                                            <span className="font-medium text-foreground">{viewingRequest.user.phone}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Buyer ID</span>
                                        <span className="font-mono text-xs text-foreground">User #{viewingRequest.user_id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Gem Specifications Section */}
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                                    <Gem className="size-3.5" /> Gem Specifications
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Gem Type</span>
                                        <span className="font-semibold text-foreground">
                                            {viewingRequest.gem_type?.name || viewingRequest.gemType?.name || 'Custom'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Shape Cut</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {(viewingRequest.gem_shape?.full_image_path || viewingRequest.gemShape?.full_image_path) && (
                                                <img
                                                    src={viewingRequest.gem_shape?.full_image_path || viewingRequest.gemShape?.full_image_path || ''}
                                                    alt="Shape"
                                                    className="size-4 object-contain"
                                                />
                                            )}
                                            <span className="font-medium text-foreground">
                                                {viewingRequest.gem_shape?.name || viewingRequest.gemShape?.name || 'Any Shape'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Color</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {(viewingRequest.gem_color?.full_image_path || viewingRequest.gemColor?.full_image_path) && (
                                                <img
                                                    src={viewingRequest.gem_color?.full_image_path || viewingRequest.gemColor?.full_image_path || ''}
                                                    alt="Color"
                                                    className="size-4 rounded-full object-cover"
                                                />
                                            )}
                                            <span className="font-medium text-foreground">
                                                {viewingRequest.gem_color?.name || viewingRequest.gemColor?.name || 'Any Color'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Quantity & Size</span>
                                        <span className="font-medium text-foreground">
                                            {viewingRequest.quantity} pcs ({viewingRequest.size || 'Unspecified'})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reference Image Preview */}
                            {(viewingRequest.reference_image_url || viewingRequest.reference_image) && (
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <ImageIcon className="size-3.5" /> Buyer Reference Image
                                        </h4>
                                        <a
                                            href={viewingRequest.reference_image_url || `/${viewingRequest.reference_image}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            Open Full <ExternalLink className="size-3" />
                                        </a>
                                    </div>
                                    <div className="w-full max-h-64 rounded-lg overflow-hidden border border-border bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-2">
                                        <img
                                            src={viewingRequest.reference_image_url || `/${viewingRequest.reference_image}`}
                                            alt="Reference Attachment"
                                            className="max-h-60 max-w-full object-contain rounded"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Request Details / Message */}
                            {viewingRequest.request_details && (
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                        <FileText className="size-3.5" /> Request Description / Notes
                                    </h4>
                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                        {viewingRequest.request_details}
                                    </p>
                                </div>
                            )}

                            {/* Dates & Status Change */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-border">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-3.5" /> Submitted: {new Date(viewingRequest.created_at).toLocaleString()}
                                    </span>
                                    {viewingRequest.withdrawn_at && (
                                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                                            <Ban className="size-3.5" /> Withdrawn: {new Date(viewingRequest.withdrawn_at).toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Status Switcher */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground">Update Status:</span>
                                    <Select
                                        value={pendingStatus?.id === viewingRequest.id ? pendingStatus.newStatus : viewingRequest.status}
                                        onValueChange={(val) => {
                                            if (val !== viewingRequest.status) {
                                                setPendingStatus({
                                                    id: viewingRequest.id,
                                                    newStatus: val as GemRequestStatus,
                                                    oldStatus: viewingRequest.status,
                                                });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[130px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="withdrawn" className="text-rose-600">Withdrawn</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Standalone Reference Image Lightbox */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-3xl p-3 bg-black/95 border-none shadow-2xl flex items-center justify-center">
                    {previewImage && (
                        <div className="relative max-h-[85vh] flex items-center justify-center">
                            <img
                                src={previewImage}
                                alt="Reference Preview"
                                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
