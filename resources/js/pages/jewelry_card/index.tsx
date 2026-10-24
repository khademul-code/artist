import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { buttonVariants } from '@/components/ui/button';
import { Edit, Trash, Eye } from 'lucide-react';
import { AlertDialog } from "@heroui/react";
import { ConfirmDialog } from '@/components/alert-dialog';
import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface JewelryCard {
    id: number;
    image: string;
    full_image_path: string;
    mini_site_url: string;
    company_name: string;
    company_type: string;
    business_category: string | string[];
    trade_show: string | string[];
    booth_number: string;
    company_bio: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip_code: string;
    status: string;
    admin_notes?: string;
    created_at: string;
}

interface PaginatedJewelryCards {
    data: JewelryCard[];
    total: number;
    current_page: number;
    per_page: number;
}

interface Props {
    jewelryCards: PaginatedJewelryCards;
}

const columns = [
    { label: 'Image', key: 'image', sortable: false },
    { label: 'Mini Site Link', key: 'mini_site_url', sortable: true },
    { label: 'Company Name', key: 'company_name', sortable: true },
    { label: 'Company Type', key: 'company_type', sortable: true },
    { label: 'Business Category', key: 'business_category', sortable: false },
    { label: 'Email', key: 'email', sortable: true },
    { label: 'Phone', key: 'phone', sortable: true },
    { label: 'Booth Number', key: 'booth_number', sortable: true },
    { label: 'Status', key: 'status', sortable: true },
    { label: 'Actions', key: 'actions' },
];

export default function Index({ jewelryCards }: Props) {
    const queryParams = new URLSearchParams(window.location.search);
    const search = queryParams.get('search') || '';
    const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

    const deleteJewelryCard = (id: number) => {
        router.delete(route('jewelry_card.destroy', id), {
            onSuccess: () => toast.success('Jewelry Card deleted successfully!'),
            onError: () => toast.error('Failed to delete the Jewelry Card.'),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Jewelry Cards', href: '/jewelry_card' }]}>
            <Head title="Jewelry Cards List" />

            <div className="m-5">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                Jewelry Cards List
                            </h1>
                            <div className="ml-auto flex items-center gap-2">
                                {selectedKeys.length > 0 && (
                                    <ConfirmDialog
                                        title="Delete Selected Jewelry Cards?"
                                        description={`Are you sure you want to delete ${selectedKeys.length} jewelry cards? This action cannot be undone.`}
                                        onConfirm={() => {
                                            router.post(route('jewelry_card.bulkDestroy'), { ids: selectedKeys }, {
                                                onSuccess: () => {
                                                    toast.success('Selected jewelry cards deleted successfully!');
                                                    setSelectedKeys([]);
                                                },
                                                onError: () => toast.error('Failed to delete jewelry cards.'),
                                            });
                                        }}
                                        trigger={
                                            <AlertDialog.Trigger className={buttonVariants({ variant: 'destructive' })}>
                                                Delete Selected ({selectedKeys.length})
                                            </AlertDialog.Trigger>
                                        }
                                    />
                                )}
                                <Link className={(buttonVariants({ variant: 'default' }))} href={route('jewelry_card.create')}>
                                    Create Jewelry Card
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table<JewelryCard>
                            data={jewelryCards.data}
                            total={jewelryCards.total}
                            currentPage={jewelryCards.current_page}
                            rowsPerPage={jewelryCards.per_page}
                            columns={columns}
                            searchableKeys={['company_type', 'business_category', 'booth_number']}
                            selectable={true}
                            selectedKeys={selectedKeys}
                            onSelectionChange={(keys) => setSelectedKeys(keys as number[])}
                            primaryKey="id"
                            renderCell={(key, value, row) => {
                                if (key === 'image') {
                                    return (
                                        <div className="w-10 h-10 overflow-hidden rounded-full flex items-center justify-center bg-gray-100">
                                            {row.image ? (
                                                <img src={typeof row.image === 'string' && row.image.startsWith('http') ? row.image : `/${row.image}`} alt="Jewelry Card" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-400">No Img</span>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'business_category') {
                                    return (
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {Array.isArray(row.business_category) && row.business_category.length > 0
                                                ? row.business_category.map((cat, idx) => (
                                                    <span key={idx} className="bg-gray-100 text-gray-800 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                                                        {cat}
                                                    </span>
                                                ))
                                                : <span>{typeof row.business_category === 'string' ? row.business_category : (row.business_category ? JSON.stringify(row.business_category) : '-')}</span>}
                                        </div>
                                    );
                                }

                                if (key === 'mini_site_url') {
                                    if (!row.mini_site_url) return <span className="text-gray-400">N/A</span>;

                                    try {
                                        const url = new URL(row.mini_site_url);
                                        return (
                                            <a
                                                href={row.mini_site_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {url.hostname}
                                            </a>
                                        );
                                    } catch (e) {
                                        return <span className="text-gray-400">N/A</span>;
                                    }
                                }

                                if (key === 'status') {
                                    return (
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                            row.status === 'publish' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }`}>
                                            {row.status === 'publish' ? 'Publish' : 'Temp Publish'}
                                        </span>
                                    );
                                }

                                if (key === 'actions') {
                                    return (
                                        <div className="flex gap-2">
                                            <Dialog>
                                                <DialogTrigger className={buttonVariants({ variant: 'secondary', size: 'icon' })}>
                                                    <Eye className="w-4 h-4 text-green-500" />
                                                </DialogTrigger>
                                                <DialogContent className="!max-w-2xl max-h-[80vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>View Jewelry Card</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid grid-cols-2 gap-4 py-4">
                                                        <div className="col-span-2 flex justify-center mb-4">
                                                            {row.image && (
                                                                <img src={typeof row.image === 'string' && row.image.startsWith('http') ? row.image : `/${row.image}`} alt="Jewelry Card" className="w-60 h-80 object-cover rounded-md shadow-sm" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Company Name</p>
                                                            <p className="text-sm text-gray-900">{row.company_name || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Company Type</p>
                                                            <p className="text-sm text-gray-900">{row.company_type || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Business Category</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {Array.isArray(row.business_category) && row.business_category.length > 0
                                                                    ? row.business_category.map((cat, idx) => (
                                                                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                                            {cat}
                                                                        </span>
                                                                    ))
                                                                    : <p className="text-sm text-gray-900">{typeof row.business_category === 'string' ? row.business_category : (row.business_category ? JSON.stringify(row.business_category) : 'N/A')}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Trade Show</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {Array.isArray(row.trade_show) && row.trade_show.length > 0
                                                                    ? row.trade_show.map((show, idx) => (
                                                                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                                            {show}
                                                                        </span>
                                                                    ))
                                                                    : <p className="text-sm text-gray-900">{typeof row.trade_show === 'string' ? row.trade_show : (row.trade_show ? JSON.stringify(row.trade_show) : 'N/A')}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Booth Number</p>
                                                            <p className="text-sm text-gray-900">{row.booth_number || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Email</p>
                                                            <p className="text-sm text-gray-900">{row.email || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Phone</p>
                                                            <p className="text-sm text-gray-900">{row.phone || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">City</p>
                                                            <p className="text-sm text-gray-900">{row.city || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Zip Code</p>
                                                            <p className="text-sm text-gray-900">{row.zip_code || 'N/A'}</p>
                                                        </div>
                                                        <div className="col-span-2 space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Address</p>
                                                            <p className="text-sm text-gray-900">{row.address || 'N/A'}</p>
                                                        </div>
                                                        <div className="col-span-2 space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Mini Site Link</p>
                                                            {row.mini_site_url ? (
                                                                <a href={row.mini_site_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">{row.mini_site_url}</a>
                                                            ) : (
                                                                <p className="text-sm text-gray-900">N/A</p>
                                                            )}
                                                        </div>
                                                        <div className="col-span-2 space-y-1">
                                                            <p className="text-sm font-medium text-gray-500">Company Bio</p>
                                                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{row.company_bio || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Link
                                                href={route('jewelry_card.edit', row.id)}
                                                className={buttonVariants({ variant: 'secondary', size: 'icon' })}
                                            >
                                                <Edit className="w-4 h-4 text-blue-500" />
                                            </Link>
                                            <ConfirmDialog
                                                title="Delete this Jewelry Card?"
                                                description="Are you sure you want to delete this Jewelry Card? This action cannot be undone."
                                                onConfirm={() => deleteJewelryCard(row.id)}
                                                trigger={
                                                    <AlertDialog.Trigger className={buttonVariants({ variant: 'secondary', size: 'icon' })}>
                                                        <Trash className="w-4 h-4 text-red-500" />
                                                    </AlertDialog.Trigger>
                                                }
                                            />
                                        </div>
                                    );
                                }

                                return value;
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
        </AppLayout>
    );
}
