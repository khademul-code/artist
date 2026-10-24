import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, DealProduct, ProductStatus } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Trash,
    Calendar,
    Eye,
    Clock,
    DollarSign,
    Layers,
    User,
    Package,
    CreditCard,
    FileText,
    CheckCircle2,
    AlertCircle,
    ShoppingBag,
    ChevronDown
} from 'lucide-react';
import { AlertDialog } from '@heroui/react';
import { ConfirmDialog } from '@/components/alert-dialog';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    product: DealProduct;
}

export default function Show({ product }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Deals', href: '#' },
        { title: 'Products', href: '/deal/product' },
        { title: product.name, href: `/deal/product/${product.id}` },
    ];

    const images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : [];
    const [selectedImage, setSelectedImage] = useState<string | null>(images[0] || null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const handleStatusUpdate = (newStatus: ProductStatus) => {
        router.patch(route('deal.product.updateStatus', product.id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Deal status updated to ${newStatus.replace('_', ' ')}!`);
            },
            onError: () => {
                toast.error('Failed to update deal status.');
            },
        });
    };

    const handleDelete = () => {
        router.delete(route('deal.product.destroy', product.id), {
            onSuccess: () => toast.success('Deal product deleted successfully!'),
            onError: () => toast.error('Failed to delete deal product.'),
        });
    };

    const getStatusBadge = (status: ProductStatus) => {
        switch (status) {
            case 'active':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800 gap-1.5 cursor-pointer py-1 px-3 text-xs">
                        <CheckCircle2 className="size-3.5" />
                        <span>Active (Visible)</span>
                        <ChevronDown className="size-3 opacity-60 ml-1" />
                    </Badge>
                );
            case 'pending_payment':
                return (
                    <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-300 dark:text-amber-400 dark:border-amber-800 gap-1.5 cursor-pointer py-1 px-3 text-xs">
                        <Clock className="size-3.5" />
                        <span>Pending Payment</span>
                        <ChevronDown className="size-3 opacity-60 ml-1" />
                    </Badge>
                );
            case 'sold':
                return (
                    <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-300 dark:text-blue-400 dark:border-blue-800 gap-1.5 cursor-pointer py-1 px-3 text-xs">
                        <ShoppingBag className="size-3.5" />
                        <span>Sold</span>
                        <ChevronDown className="size-3 opacity-60 ml-1" />
                    </Badge>
                );
            case 'expired':
                return (
                    <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-300 dark:text-rose-400 dark:border-rose-800 gap-1.5 cursor-pointer py-1 px-3 text-xs">
                        <AlertCircle className="size-3.5" />
                        <span>Expired</span>
                        <ChevronDown className="size-3 opacity-60 ml-1" />
                    </Badge>
                );
            case 'inactive':
                return (
                    <Badge variant="secondary" className="gap-1.5 cursor-pointer py-1 px-3 text-xs">
                        <span>Inactive (Hidden)</span>
                        <ChevronDown className="size-3 opacity-60 ml-1" />
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="gap-1.5 cursor-pointer py-1 px-3 text-xs">
                        <span>{status}</span>
                        <ChevronDown className="size-3 opacity-60 ml-1" />
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
                        Payment Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline" className="font-normal">{paymentStatus}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Deal - ${product.name}`} />

            <div className="m-5 space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Link
                            href={route('deal.product.index')}
                            className="p-2 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                            title="Back to products list"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    {product.name}
                                </h1>

                                {/* Status Update Dropdown Button */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="focus:outline-hidden">
                                            {getStatusBadge(product.status)}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-52 shadow-lg">
                                        <DropdownMenuLabel className="text-xs">Change Publication Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleStatusUpdate('active')}
                                            className="text-xs gap-2"
                                        >
                                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                                            <span>Set Active (Visible)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusUpdate('inactive')}
                                            className="text-xs gap-2"
                                        >
                                            <AlertCircle className="size-3.5 text-zinc-500" />
                                            <span>Set Inactive (Hidden)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusUpdate('sold')}
                                            className="text-xs gap-2"
                                        >
                                            <ShoppingBag className="size-3.5 text-blue-600" />
                                            <span>Mark as Sold</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusUpdate('expired')}
                                            className="text-xs gap-2"
                                        >
                                            <Clock className="size-3.5 text-rose-600" />
                                            <span>Mark as Expired</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusUpdate('pending_payment')}
                                            className="text-xs gap-2"
                                        >
                                            <DollarSign className="size-3.5 text-amber-600" />
                                            <span>Pending Payment</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {getPaymentBadge(product.payment_status, product.payment_fee)}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                                Slug: /{product.slug} &bull; Created {new Date(product.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <ConfirmDialog
                            title="Delete Deal Product?"
                            description={`Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`}
                            onConfirm={handleDelete}
                            trigger={
                                <AlertDialog.Trigger className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-destructive hover:bg-destructive/90 shadow-xs cursor-pointer">
                                    <Trash className="size-3.5" />
                                    <span>Delete Product</span>
                                </AlertDialog.Trigger>
                            }
                        />
                    </div>
                </div>

                {/* Key Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="shadow-xs border p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase">Price</p>
                        {product.offer_price != null ? (
                            <>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                                    ${Number(product.offer_price).toFixed(2)}
                                </p>
                                <p className="text-[11px] text-muted-foreground line-through mt-0.5">
                                    ${Number(product.base_price).toFixed(2)}
                                </p>
                            </>
                        ) : (
                            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                                ${Number(product.base_price).toFixed(2)}
                            </p>
                        )}
                    </Card>

                    <Card className="shadow-xs border p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase">Stock</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                            {product.quantity} <span className="text-xs font-normal text-muted-foreground">units</span>
                        </p>
                    </Card>

                    <Card className="shadow-xs border p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase">Deal Duration</p>
                        <p className="text-sm font-semibold text-foreground mt-1">
                            {product.deal_duration || 'Until Sold'}
                        </p>
                    </Card>

                    <Card className="shadow-xs border p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase">Expiration</p>
                        <p className="text-sm font-semibold text-foreground mt-1">
                            {product.expires_at ? new Date(product.expires_at).toLocaleDateString() : 'No limit'}
                        </p>
                    </Card>

                    <Card className="shadow-xs border p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase">Total Views</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                            <Eye className="size-4 text-muted-foreground" />
                            {product.view_count || 0}
                        </p>
                    </Card>

                    <Card className="shadow-xs border p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase">Payment Fee</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                            ${Number(product.payment_fee || 0).toFixed(2)}
                        </p>
                    </Card>
                </div>

                {/* Main Content Grid: Left Images & Category, Right Specs & Description */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Image Gallery & Seller Card */}
                    <div className="space-y-4">
                        <Card className="shadow-xs border overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Package className="size-4 text-primary" />
                                    <span>Product Photos</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                {selectedImage ? (
                                    <div
                                        onClick={() => setLightboxImage(selectedImage)}
                                        className="aspect-square rounded-xl border overflow-hidden bg-muted cursor-pointer relative group flex items-center justify-center"
                                        title="Click to view full image"
                                    >
                                        <img
                                            src={selectedImage}
                                            alt={product.name}
                                            className="size-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5">
                                            <Eye className="size-4" />
                                            <span>Click to expand</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-square rounded-xl border bg-muted flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                                        <Package className="size-12 stroke-[1.5] mb-2" />
                                        <p className="text-xs">No images uploaded</p>
                                    </div>
                                )}

                                {images.length > 1 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedImage(img)}
                                                className={`aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all ${
                                                    selectedImage === img
                                                        ? 'ring-2 ring-primary ring-offset-1 border-transparent'
                                                        : 'opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                <img src={img} alt={`Thumbnail ${idx + 1}`} className="size-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Category & Taxonomy Card */}
                        <Card className="shadow-xs border">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Layers className="size-4 text-primary" />
                                    <span>Category & Classification</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-2 text-xs">
                                <div className="flex justify-between items-center py-1.5 border-b">
                                    <span className="text-muted-foreground">Product Category</span>
                                    <span className="font-semibold">{product.category?.name || 'Unassigned'}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b">
                                    <span className="text-muted-foreground">Product Type</span>
                                    <span className="font-medium">{product.product_type || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-muted-foreground">URL Slug</span>
                                    <span className="font-mono text-[11px] text-muted-foreground">/{product.slug}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Seller / Supplier Card */}
                        <Card className="shadow-xs border">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="size-4 text-primary" />
                                    <span>Seller Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-2 text-xs">
                                {product.user ? (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                {product.user.name ? product.user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-foreground">{product.user.name}</p>
                                                <p className="text-muted-foreground">{product.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t flex justify-between">
                                            <span className="text-muted-foreground">Account Role</span>
                                            <span className="font-semibold uppercase tracking-wider text-[10px] bg-muted px-2 py-0.5 rounded">
                                                {product.user.role || 'user'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">Platform Admin Listing</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Specifications, Description & Payment Info */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Specifications Card */}
                        <Card className="shadow-xs border">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="size-5 text-indigo-600" />
                                    <span>Product Specifications</span>
                                </CardTitle>
                                <CardDescription>
                                    Gemological and physical characteristics provided for this deal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {product.product_information && product.product_information.length > 0 ? (
                                    <div className="border rounded-xl overflow-hidden divide-y text-xs">
                                        <div className="grid grid-cols-2 p-3 bg-muted/40 font-semibold text-muted-foreground">
                                            <span>Topic / Field</span>
                                            <span>Specification Detail</span>
                                        </div>
                                        {product.product_information.map((spec, i) => (
                                            <div key={i} className="grid grid-cols-2 p-3 bg-card hover:bg-muted/20 transition-colors">
                                                <span className="font-medium text-foreground">{spec.topic}</span>
                                                <span className="text-muted-foreground">{spec.information}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic py-3">
                                        No specifications provided for this product deal.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Description Card */}
                        <Card className="shadow-xs border">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="size-5 text-amber-600" />
                                    <span>Deal Description</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {product.description ? (
                                    <div className="p-4 rounded-xl border bg-card text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {product.description}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">
                                        No description provided.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Technical Payment & Stripe Card */}
                        {(product.stripe_session_id || product.stripe_payment_intent_id || product.payment_status) && (
                            <Card className="shadow-xs border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <CreditCard className="size-4 text-emerald-600" />
                                        <span>Payment Processing Records</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border font-mono">
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-sans">Payment Status</span>
                                            <span className="font-semibold">{product.payment_status}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-sans">Payment Fee</span>
                                            <span className="font-semibold">${Number(product.payment_fee || 0).toFixed(2)}</span>
                                        </div>
                                        {product.stripe_payment_intent_id && (
                                            <div className="sm:col-span-2">
                                                <span className="text-muted-foreground block text-[10px] uppercase font-sans">Stripe Payment Intent ID</span>
                                                <span className="break-all">{product.stripe_payment_intent_id}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Image Preview Dialog */}
            <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
                <DialogContent className="max-w-4xl p-2 bg-black/95 border-0 flex items-center justify-center">
                    {lightboxImage && (
                        <img
                            src={lightboxImage}
                            alt="Deal Full Preview"
                            className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
