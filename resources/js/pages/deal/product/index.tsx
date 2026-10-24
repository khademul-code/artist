import AppLayout from '@/layouts/app-layout';
import { DealProduct, PaginatedProducts, ProductCategory, ProductStatus, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Eye,
    Trash,
    Package,
    Ticket,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink,
    RotateCcw,
    Calendar,
    ShoppingBag,
    ChevronDown,
    AlertCircle
} from 'lucide-react';
import { ConfirmDialog } from '@/components/alert-dialog';
import { AlertDialog } from "@heroui/react";
import { useState } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    products: PaginatedProducts;
    statusCounts: {
        all: number;
        active: number;
        pending_payment: number;
        sold: number;
        expired: number;
        inactive: number;
    };
    metrics: {
        total_deals: number;
        active_deals: number;
        sold_deals: number;
        expired_deals: number;
        total_revenue: number;
        total_views: number;
    };
    categories: ProductCategory[];
    suppliers: User[];
    filters?: {
        search?: string;
        status?: string;
        payment_status?: string;
        category_id?: string;
        user_id?: string;
        per_page?: number;
    };
}

const columns = [
    { label: 'Product', key: 'product', sortable: true },
    { label: 'Category', key: 'category', sortable: false },
    { label: 'Seller', key: 'user', sortable: false },
    { label: 'Price & Stock', key: 'price', sortable: true },
    { label: 'Duration / Expiry', key: 'deal_duration', sortable: false },
    { label: 'Deal Status (Click to Change)', key: 'status', sortable: true },
    { label: 'Payment', key: 'payment_status', sortable: true },
    { label: 'Views', key: 'view_count', sortable: true },
    { label: 'Actions', key: 'actions', sortable: false },
];

export default function Index({
    products,
    statusCounts,
    metrics,
    categories,
    suppliers,
    filters = {}
}: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [quickViewProduct, setQuickViewProduct] = useState<DealProduct | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const activeStatus = filters.status || 'all';

    const handleFilterChange = (key: string, value: string) => {
        const nextFilters = {
            ...filters,
            [key]: value === 'all' ? undefined : value,
            page: 1,
        };
        router.get(route('deal.product.index'), nextFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        router.get(route('deal.product.index'), {}, {
            preserveState: true,
        });
    };

    const handleSearchChange = (search: string) => {
        router.get(route('deal.product.index'), {
            ...filters,
            search: search || undefined,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusUpdate = (productId: number, newStatus: ProductStatus) => {
        router.patch(route('deal.product.updateStatus', productId), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}!`);
                if (quickViewProduct && quickViewProduct.id === productId) {
                    setQuickViewProduct({
                        ...quickViewProduct,
                        status: newStatus,
                    });
                }
            },
            onError: () => {
                toast.error('Failed to update product status.');
            },
        });
    };

    const handleDelete = (id: number) => {
        router.delete(route('deal.product.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Deal product deleted successfully!');
                if (quickViewProduct?.id === id) {
                    setQuickViewProduct(null);
                }
            },
            onError: () => toast.error('Failed to delete deal product.'),
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        router.post(route('deal.product.bulkDestroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${selectedIds.length} deal products deleted successfully!`);
                setSelectedIds([]);
            },
            onError: () => toast.error('Failed to delete selected products.'),
        });
    };

    const getStatusBadge = (status: ProductStatus) => {
        switch (status) {
            case 'active':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800 gap-1 cursor-pointer">
                        <CheckCircle2 className="size-3" />
                        <span>Active</span>
                        <ChevronDown className="size-3 opacity-60 ml-0.5" />
                    </Badge>
                );
            case 'pending_payment':
                return (
                    <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-300 dark:text-amber-400 dark:border-amber-800 gap-1 cursor-pointer">
                        <Clock className="size-3" />
                        <span>Pending Payment</span>
                        <ChevronDown className="size-3 opacity-60 ml-0.5" />
                    </Badge>
                );
            case 'sold':
                return (
                    <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-300 dark:text-blue-400 dark:border-blue-800 gap-1 cursor-pointer">
                        <ShoppingBag className="size-3" />
                        <span>Sold</span>
                        <ChevronDown className="size-3 opacity-60 ml-0.5" />
                    </Badge>
                );
            case 'expired':
                return (
                    <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-300 dark:text-rose-400 dark:border-rose-800 gap-1 cursor-pointer">
                        <AlertCircle className="size-3" />
                        <span>Expired</span>
                        <ChevronDown className="size-3 opacity-60 ml-0.5" />
                    </Badge>
                );
            case 'inactive':
                return (
                    <Badge variant="secondary" className="gap-1 cursor-pointer">
                        <span>Inactive</span>
                        <ChevronDown className="size-3 opacity-60 ml-0.5" />
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="gap-1 cursor-pointer">
                        <span>{status}</span>
                        <ChevronDown className="size-3 opacity-60 ml-0.5" />
                    </Badge>
                );
        }
    };

    const getPaymentBadge = (paymentStatus: string, fee: number | string) => {
        const numFee = typeof fee === 'number' ? fee : parseFloat(fee || '0');
        switch (paymentStatus) {
            case 'paid':
                return (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-normal">
                        Paid (${numFee.toFixed(2)})
                    </Badge>
                );
            case 'free':
                return (
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 font-normal">
                        Free Deal
                    </Badge>
                );
            case 'unpaid':
                return (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 font-normal">
                        Unpaid (${numFee.toFixed(2)})
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 font-normal">
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline" className="font-normal">{paymentStatus}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Deals', href: '#' },
            { title: 'Products', href: '/deal/product' }
        ]}>
            <Head title="Deal Products List" />

            <div className="m-5 space-y-5">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Ticket className="h-6 w-6" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                Deal Products
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-10">
                            Monitor promotional deals, inspect product listings, and manage publication statuses.
                        </p>
                    </div>

                    {selectedIds.length > 0 && (
                        <ConfirmDialog
                            title="Delete Selected Deal Products?"
                            description={`Are you sure you want to permanently delete ${selectedIds.length} deal products and their uploaded images? This action cannot be undone.`}
                            onConfirm={handleBulkDelete}
                            trigger={
                                <AlertDialog.Trigger className={buttonVariants({ variant: 'destructive', size: 'sm', className: 'gap-1.5 shadow-xs cursor-pointer' })}>
                                    <Trash className="size-3.5" />
                                    <span>Delete Selected ({selectedIds.length})</span>
                                </AlertDialog.Trigger>
                            }
                        />
                    )}
                </div>

                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="border shadow-xs hover:border-primary/40 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Deals</p>
                                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{metrics.total_deals}</p>
                            </div>
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl dark:bg-blue-950/50 dark:text-blue-400">
                                <Package className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-xs hover:border-emerald-500/40 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Deals</p>
                                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{metrics.active_deals}</p>
                            </div>
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/50 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-xs hover:border-blue-500/40 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sold Deals</p>
                                <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{metrics.sold_deals}</p>
                            </div>
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl dark:bg-blue-950/50 dark:text-blue-400">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-xs hover:border-rose-500/40 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expired Deals</p>
                                <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{metrics.expired_deals}</p>
                            </div>
                            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-950/50 dark:text-rose-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-xs hover:border-amber-500/40 transition-colors col-span-2 sm:col-span-1">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fees Collected</p>
                                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                                    ${Number(metrics.total_revenue).toFixed(2)}
                                </p>
                            </div>
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950/50 dark:text-amber-400">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-xs border w-full">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col gap-4">
                            {/* Status Quick Filter Tabs */}
                            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-lg w-fit">
                                {[
                                    { key: 'all', label: 'All Deals', count: statusCounts.all },
                                    { key: 'active', label: 'Active', count: statusCounts.active },
                                    { key: 'pending_payment', label: 'Pending Payment', count: statusCounts.pending_payment },
                                    { key: 'sold', label: 'Sold', count: statusCounts.sold },
                                    { key: 'expired', label: 'Expired', count: statusCounts.expired },
                                    { key: 'inactive', label: 'Inactive', count: statusCounts.inactive },
                                ].map((tab) => {
                                    const isActive = activeStatus === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => handleFilterChange('status', tab.key)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                isActive
                                                    ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <span>{tab.label}</span>
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                                isActive
                                                    ? 'bg-primary/10 text-primary font-bold'
                                                    : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Filters Row */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Category Filter */}
                                <div className="w-48">
                                    <Select
                                        value={filters.category_id || 'all'}
                                        onValueChange={(val) => handleFilterChange('category_id', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Payment Status Filter */}
                                <div className="w-44">
                                    <Select
                                        value={filters.payment_status || 'all'}
                                        onValueChange={(val) => handleFilterChange('payment_status', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Payment Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Payment Status</SelectItem>
                                            <SelectItem value="free">Free Deal</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="unpaid">Unpaid</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Supplier Filter */}
                                <div className="w-48">
                                    <Select
                                        value={filters.user_id || 'all'}
                                        onValueChange={(val) => handleFilterChange('user_id', val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="All Sellers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sellers</SelectItem>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name} ({s.role || 'user'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(filters.search || (filters.status && filters.status !== 'all') || filters.payment_status || filters.category_id || filters.user_id) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Reset Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6">
                        <Table
                            columns={columns}
                            data={products.data}
                            total={products.total}
                            currentPage={products.current_page}
                            rowsPerPage={products.per_page}
                            searchValue={filters.search || ''}
                            onSearchChange={handleSearchChange}
                            selectable
                            selectedKeys={selectedIds}
                            onSelectionChange={setSelectedIds}
                            onPageChange={(page) => {
                                router.get(route('deal.product.index'), {
                                    ...filters,
                                    page,
                                }, { preserveState: true });
                            }}
                            onPerPageChange={(perPage) => {
                                router.get(route('deal.product.index'), {
                                    ...filters,
                                    per_page: perPage,
                                    page: 1,
                                }, { preserveState: true });
                            }}
                            renderCell={(key, value, row: DealProduct) => {
                                if (key === 'product') {
                                    const primaryImg = row.image_urls && row.image_urls.length > 0 ? row.image_urls[0] : null;
                                    return (
                                        <div className="flex items-center gap-3 min-w-[220px]">
                                            <div
                                                onClick={() => primaryImg && setPreviewImage(primaryImg)}
                                                className="relative size-12 rounded-lg border bg-muted/40 overflow-hidden flex-shrink-0 cursor-pointer group flex items-center justify-center"
                                                title="Click to zoom image"
                                            >
                                                {primaryImg ? (
                                                    <img
                                                        src={primaryImg}
                                                        alt={row.name}
                                                        className="size-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <Package className="size-5 text-muted-foreground" />
                                                )}
                                                {row.image_urls && row.image_urls.length > 1 && (
                                                    <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] text-white px-1 rounded font-bold">
                                                        +{row.image_urls.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <Link
                                                    href={route('deal.product.show', row.id)}
                                                    className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-primary transition-colors text-left line-clamp-1 block"
                                                >
                                                    {row.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground line-clamp-1 font-mono">
                                                    /{row.slug}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (key === 'category') {
                                    return (
                                        <div className="min-w-[110px]">
                                            {row.category ? (
                                                <Badge variant="outline" className="font-normal text-xs">
                                                    {row.category.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">None</span>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'user') {
                                    return (
                                        <div className="min-w-[140px] text-xs">
                                            {row.user ? (
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{row.user.name}</p>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1">{row.user.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Platform Admin</span>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'price') {
                                    const basePrice = Number(row.base_price || 0);
                                    const offerPrice = row.offer_price != null ? Number(row.offer_price) : null;
                                    return (
                                        <div className="min-w-[110px]">
                                            {offerPrice != null ? (
                                                <>
                                                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                        ${offerPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground line-through">
                                                        ${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                    ${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            )}
                                            <div className="text-[11px] text-muted-foreground">
                                                Qty: <span className="font-medium text-foreground">{row.quantity}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                if (key === 'deal_duration') {
                                    return (
                                        <div className="min-w-[130px] text-xs">
                                            <div className="font-medium text-foreground">
                                                {row.deal_duration || 'Until Sold'}
                                            </div>
                                            {row.expires_at ? (
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Calendar className="size-3" />
                                                    <span>{new Date(row.expires_at).toLocaleDateString()}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground">No expiration</span>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'status') {
                                    return (
                                        <div className="min-w-[150px]">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="focus:outline-hidden text-left transition-transform active:scale-95">
                                                        {getStatusBadge(row.status)}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-48 shadow-lg">
                                                    <DropdownMenuLabel className="text-xs">Update Publication Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusUpdate(row.id, 'active')}
                                                        className="text-xs gap-2"
                                                    >
                                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                        <span>Set Active (Visible)</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusUpdate(row.id, 'inactive')}
                                                        className="text-xs gap-2"
                                                    >
                                                        <AlertCircle className="size-3.5 text-zinc-500" />
                                                        <span>Set Inactive (Hidden)</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusUpdate(row.id, 'sold')}
                                                        className="text-xs gap-2"
                                                    >
                                                        <ShoppingBag className="size-3.5 text-blue-600" />
                                                        <span>Mark as Sold</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusUpdate(row.id, 'expired')}
                                                        className="text-xs gap-2"
                                                    >
                                                        <Clock className="size-3.5 text-rose-600" />
                                                        <span>Mark as Expired</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusUpdate(row.id, 'pending_payment')}
                                                        className="text-xs gap-2"
                                                    >
                                                        <DollarSign className="size-3.5 text-amber-600" />
                                                        <span>Pending Payment</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    );
                                }

                                if (key === 'payment_status') {
                                    return (
                                        <div className="min-w-[110px]">
                                            {getPaymentBadge(row.payment_status, row.payment_fee)}
                                        </div>
                                    );
                                }

                                if (key === 'view_count') {
                                    return (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Eye className="size-3.5" />
                                            <span>{row.view_count || 0}</span>
                                        </div>
                                    );
                                }

                                if (key === 'actions') {
                                    return (
                                        <div className="flex items-center gap-1.5">
                                            {/* Quick view dialog */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-8"
                                                title="Quick Preview Deal"
                                                onClick={() => setQuickViewProduct(row)}
                                            >
                                                <Eye className="size-4" />
                                            </Button>

                                            {/* Full page show link */}
                                            <Link
                                                href={route('deal.product.show', row.id)}
                                                className={buttonVariants({ variant: 'outline', size: 'icon', className: 'size-8' })}
                                                title="View Full Deal Details"
                                            >
                                                <ExternalLink className="size-4" />
                                            </Link>

                                            {/* Delete */}
                                            <ConfirmDialog
                                                title="Delete Deal Product?"
                                                description={`Are you sure you want to permanently delete "${row.name}"? This action cannot be undone.`}
                                                onConfirm={() => handleDelete(row.id)}
                                                trigger={
                                                    <AlertDialog.Trigger className={buttonVariants({ variant: 'outline', size: 'icon', className: 'size-8 text-destructive hover:bg-destructive/10 cursor-pointer' })}>
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

            {/* Quick View Dialog */}
            <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    {quickViewProduct && (
                        <div className="space-y-5">
                            <DialogHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <DialogTitle className="text-xl font-bold">
                                            {quickViewProduct.name}
                                        </DialogTitle>
                                        <DialogDescription className="font-mono text-xs mt-1">
                                            Slug: /{quickViewProduct.slug}
                                        </DialogDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="focus:outline-hidden">
                                                    {getStatusBadge(quickViewProduct.status)}
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 shadow-lg">
                                                <DropdownMenuLabel className="text-xs">Update Status</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(quickViewProduct.id, 'active')}>
                                                    Set Active (Visible)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(quickViewProduct.id, 'inactive')}>
                                                    Set Inactive (Hidden)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(quickViewProduct.id, 'sold')}>
                                                    Mark as Sold
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(quickViewProduct.id, 'expired')}>
                                                    Mark as Expired
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(quickViewProduct.id, 'pending_payment')}>
                                                    Pending Payment
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {getPaymentBadge(quickViewProduct.payment_status, quickViewProduct.payment_fee)}
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Images Gallery */}
                            {quickViewProduct.image_urls && quickViewProduct.image_urls.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Photos</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {quickViewProduct.image_urls.map((url, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setPreviewImage(url)}
                                                className="aspect-square rounded-lg border overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                <img src={url} alt={`Preview ${idx}`} className="size-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Key Deal Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-xl border text-xs">
                                <div>
                                    <p className="text-muted-foreground">Price</p>
                                    {quickViewProduct.offer_price != null ? (
                                        <>
                                            <p className="font-bold text-base text-gray-900 dark:text-white mt-0.5">
                                                ${Number(quickViewProduct.offer_price).toFixed(2)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground line-through mt-0.5">
                                                ${Number(quickViewProduct.base_price).toFixed(2)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-bold text-base text-gray-900 dark:text-white mt-0.5">
                                            ${Number(quickViewProduct.base_price).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Available Quantity</p>
                                    <p className="font-semibold text-sm mt-0.5">{quickViewProduct.quantity} units</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Deal Duration</p>
                                    <p className="font-semibold text-sm mt-0.5">{quickViewProduct.deal_duration || 'Until Sold'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Views</p>
                                    <p className="font-semibold text-sm mt-0.5">{quickViewProduct.view_count || 0}</p>
                                </div>
                            </div>

                            {/* Category & Seller Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="p-3 border rounded-lg space-y-1">
                                    <p className="text-muted-foreground font-medium">Category Information</p>
                                    <p className="font-semibold text-sm text-foreground">
                                        {quickViewProduct.category?.name || 'Unassigned'}
                                    </p>
                                    <p className="text-muted-foreground">Type: {quickViewProduct.product_type || 'N/A'}</p>
                                </div>
                                <div className="p-3 border rounded-lg space-y-1">
                                    <p className="text-muted-foreground font-medium">Seller / Supplier</p>
                                    <p className="font-semibold text-sm text-foreground">
                                        {quickViewProduct.user?.name || 'Platform Admin'}
                                    </p>
                                    <p className="text-muted-foreground">{quickViewProduct.user?.email || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Product Information / Specs */}
                            {quickViewProduct.product_information && quickViewProduct.product_information.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specifications</p>
                                    <div className="border rounded-lg overflow-hidden divide-y text-xs">
                                        {quickViewProduct.product_information.map((spec, i) => (
                                            <div key={i} className="flex justify-between p-2.5 bg-card hover:bg-muted/30">
                                                <span className="font-medium text-muted-foreground">{spec.topic}</span>
                                                <span className="font-semibold text-foreground">{spec.information}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {quickViewProduct.description && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                                    <div className="p-3 border rounded-lg bg-card text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                                        {quickViewProduct.description}
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <Link
                                    href={route('deal.product.show', quickViewProduct.id)}
                                    className={buttonVariants({ variant: 'default', size: 'sm', className: 'gap-1.5 text-xs' })}
                                >
                                    <ExternalLink className="size-3.5" />
                                    View Full Deal Details
                                </Link>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuickViewProduct(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Image Preview Lightbox Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-3xl p-2 bg-black/90 border-0 flex items-center justify-center">
                    {previewImage && (
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-h-[80vh] w-auto max-w-full object-contain rounded"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
