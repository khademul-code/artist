import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { Trash, Eye, CreditCard, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/alert-dialog';
import { AlertDialog } from "@heroui/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserInfo {
    id: number;
    name: string;
    email: string;
}

interface CompanyInformationRow {
    id: number;
    image: string | null;
    company_name: string | null;
    year_of_est: string | null;
    company_bio: string | null;
    company_type: string | null;
    company_phone: string | null;
    company_address: string | null;
    business_category: string[] | null;
    sendcontact_link: string | null;
    zip_code: string | null;
    city: string | null;
    status: string;
    admin_notes?: string;
    user: UserInfo | null;
}

interface PaginatedCompanyInfo {
    data: CompanyInformationRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Filters {
    search: string;
}

interface Props {
    companyInfos: PaginatedCompanyInfo;
    filters: Filters;
}

const columns = [
    { label: 'Image', key: 'image', sortable: false },
    { label: 'Company Name', key: 'company_name', sortable: true },
    { label: 'User', key: 'user', sortable: false },
    { label: 'Type', key: 'company_type', sortable: true },
    { label: 'Est.', key: 'year_of_est', sortable: true },
    { label: 'Status', key: 'status', sortable: true },
    { label: 'Actions', key: 'actions' },
];

const StatusUpdater = ({ companyInfo }: { companyInfo: CompanyInformationRow }) => {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(companyInfo.status || 'pending');
    const [notes, setNotes] = useState(companyInfo.admin_notes || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.patch(route('company-information.updateStatus', companyInfo.id), {
            status,
            admin_notes: notes
        }, {
            onSuccess: () => {
                toast.success('Status updated and user notified successfully');
                setOpen(false);
                setLoading(false);
            },
            onError: () => {
                toast.error('Failed to update status');
                setLoading(false);
            }
        });
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded cursor-pointer border border-green-200 hover:bg-green-200">Approved</span>;
            case 'requires_changes': return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded cursor-pointer border border-orange-200 hover:bg-orange-200">Requires Changes</span>;
            default: return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded cursor-pointer border border-yellow-200 hover:bg-yellow-200">Pending</span>;
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="inline-block">{getStatusBadge(companyInfo.status)}</div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Status for {companyInfo.company_name || 'Company Info'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="requires_changes">Requires Changes</option>
                        </select>
                    </div>
                    {status === 'requires_changes' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Admin Notes (sent to user)</label>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    )}
                    <button type="submit" disabled={loading} className={buttonVariants({ variant: 'default' })}>
                        {loading ? 'Updating...' : 'Update Status'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default function Index({ companyInfos, filters }: Props) {
    const queryParams = new URLSearchParams(window.location.search);
    const search = queryParams.get('search') || '';
    const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

    const deleteCompanyInfo = (id: number) => {
        router.delete(route('company-information.destroy', id), {
            onSuccess: () => toast.success('Company Information deleted successfully!'),
            onError: () => toast.error('Failed to delete Company Information.'),
        });
    };

    const [selectedCompany, setSelectedCompany] = useState<CompanyInformationRow | null>(null);

    return (
        <AppLayout breadcrumbs={[{ title: 'Company Information', href: '/company-information' }]}>
            <Head title="Company Information" />

            <div className="m-5">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Company Information</h1>
                            <div className="ml-auto flex items-center gap-2">
                                {selectedKeys.length > 0 && (
                                    <ConfirmDialog
                                        title="Delete Selected Company Info?"
                                        description={`Are you sure you want to delete ${selectedKeys.length} company info entries? This action cannot be undone.`}
                                        onConfirm={() => {
                                            router.post(route('company-information.bulkDestroy'), { ids: selectedKeys }, {
                                                onSuccess: () => {
                                                    toast.success('Selected company info deleted successfully!');
                                                    setSelectedKeys([]);
                                                },
                                                onError: () => toast.error('Failed to delete company info.'),
                                            });
                                        }}
                                        trigger={
                                            <AlertDialog.Trigger className={buttonVariants({ variant: 'destructive' })}>
                                                Delete Selected ({selectedKeys.length})
                                            </AlertDialog.Trigger>
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table<CompanyInformationRow>
                            data={companyInfos.data}
                            total={companyInfos.total}
                            currentPage={companyInfos.current_page}
                            rowsPerPage={companyInfos.per_page}
                            columns={columns}
                            searchableKeys={['company_name', 'user.name', 'user.email']}
                            selectable={true}
                            selectedKeys={selectedKeys}
                            onSelectionChange={(keys) => setSelectedKeys(keys as number[])}
                            primaryKey="id"
                            renderCell={(key, value, row) => {
                                if (key === 'image') {
                                    return (
                                        <div className="w-10 h-10 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
                                            {row.image ? (
                                                <img src={row.image.startsWith('http') ? row.image : `/${row.image}`} alt={row.company_name || 'Logo'} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-400">No Img</span>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'user') {
                                    return (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{row.user?.name || 'N/A'}</span>
                                            <span className="text-xs text-gray-500">{row.user?.email || ''}</span>
                                        </div>
                                    );
                                }

                                if (key === 'status') {
                                    return <StatusUpdater companyInfo={row} />;
                                }

                                if (key === 'actions') {
                                    return (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className={buttonVariants({ variant: 'secondary', size: 'icon' })}
                                                onClick={() => setSelectedCompany(row)}
                                            >
                                                <Eye className="w-4 h-4 text-emerald-500" />
                                            </button>
                                            {/* {row.status !== 'approved' && (
                                                <Link
                                                    href={route('jewelry_card.create', {
                                                        company_information_id: row.id,
                                                        image: row.image || '',
                                                        company_name: row.company_name || '',
                                                        company_type: row.company_type || '',
                                                        business_category: row.business_category || [],
                                                        company_bio: row.company_bio || '',
                                                        email: row.user?.email || '',
                                                        phone: row.company_phone || '',
                                                        address: row.company_address || '',
                                                        city: row.city || '',
                                                        zip_code: row.zip_code || '',
                                                        mini_site_url: row.sendcontact_link || '',
                                                    })}
                                                    className={buttonVariants({ variant: 'default', size: 'icon' })}
                                                    title="Create Jewelry Card"
                                                >
                                                    <CreditCard className="w-4 h-4 text-blue-500" />
                                                </Link>
                                            )} */}

                                            {/* {!row.sendcontact_link && row.status !== 'requires_changes' && row.status !== 'approved' && (
                                                <ConfirmDialog
                                                    title="Send Reminder Email?"
                                                    description="This will send a reminder email to the company owner asking them to add their Mini Site Link. Their status will be set to Requires Changes."
                                                    confirmText="Send Reminder"
                                                    confirmColor="warning"
                                                    icon={<Mail className="size-5" />}
                                                    onConfirm={() => {
                                                        router.post(route('company-information.sendReminder', row.id), {}, {
                                                            onSuccess: () => toast.success('Reminder email sent successfully!'),
                                                            onError: () => toast.error('Failed to send reminder email.'),
                                                        });
                                                    }}
                                                    trigger={
                                                        <AlertDialog.Trigger className={buttonVariants({ variant: 'secondary', size: 'icon' })} title="Send Mail Reminder for adding Mini Site Link">
                                                            <Mail className="w-4 h-4 text-orange-500" />
                                                        </AlertDialog.Trigger>
                                                    }
                                                />
                                            )} */}

                                            <ConfirmDialog
                                                title="Delete this Company Info?"
                                                description="Are you sure you want to delete this Company Information? This action cannot be undone."
                                                onConfirm={() => deleteCompanyInfo(row.id)}
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

            <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Company Information</DialogTitle>
                    </DialogHeader>
                    {selectedCompany && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {selectedCompany.image ? (
                                        <img src={selectedCompany.image.startsWith('http') ? selectedCompany.image : `/${selectedCompany.image}`} alt={selectedCompany.company_name || 'Logo'} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">No Img</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedCompany.company_name || 'N/A'}</h3>
                                    <p className="text-sm text-gray-500">Owned by {selectedCompany.user?.name} ({selectedCompany.user?.email})</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Established</p>
                                    <p className="text-sm">{selectedCompany.year_of_est || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Company Type</p>
                                    <p className="text-sm">{selectedCompany.company_type || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Company Phone</p>
                                    <p className="text-sm">{selectedCompany.company_phone || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Business Category</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedCompany.business_category?.map((cat, idx) => (
                                            <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                {cat}
                                            </span>
                                        )) || 'N/A'}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Bio</p>
                                    <p className="text-sm">{selectedCompany.company_bio || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Address</p>
                                    <p className="text-sm">
                                        {selectedCompany.company_address} 
                                        {selectedCompany.city ? `, ${selectedCompany.city}` : ''}
                                        {selectedCompany.zip_code ? ` ${selectedCompany.zip_code}` : ''}
                                        {!selectedCompany.company_address && !selectedCompany.city && !selectedCompany.zip_code && 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Zip Code</p>
                                    <p className="text-sm">{selectedCompany.zip_code || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">City</p>
                                    <p className="text-sm">{selectedCompany.city || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Mini Site Link</p>
                                    {selectedCompany.sendcontact_link ? (
                                        <a href={selectedCompany.sendcontact_link} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">
                                            {selectedCompany.sendcontact_link}
                                        </a>
                                    ) : (
                                        <p className="text-sm">N/A</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
