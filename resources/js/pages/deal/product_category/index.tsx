import AppLayout from '@/layouts/app-layout';
import { PaginatedProductCategories, ProductCategory } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Edit, Plus, Trash } from 'lucide-react';
import { AlertDialog } from "@heroui/react";
import { ConfirmDialog } from '@/components/alert-dialog';
import { useState, useRef, useEffect, FormEventHandler } from 'react';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from '@/components/input-error';

interface Props {
    categories: PaginatedProductCategories;
}

const columns = [
    { label: 'Category Name', key: 'name', sortable: true },
    { label: 'Status', key: 'status', sortable: true },
    { label: 'Created At', key: 'created_at', sortable: true },
    { label: 'Actions', key: 'actions' },
];

export default function Index({ categories }: Props) {
    const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const search = queryParams.get('search') || '';

    // Create Modal State & Form
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const createForm = useForm<{ name: string; status: 'active' | 'inactive' }>({
        name: '',
        status: 'active',
    });

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(route('deal.product-category.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                toast.success('Product category created successfully!');
            },
            onError: () => {
                toast.error('Failed to create product category.');
            },
        });
    };

    // Edit Modal State & Form
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const editForm = useForm<{ name: string; status: 'active' | 'inactive' }>({
        name: '',
        status: 'active',
    });

    const openEditModal = (category: ProductCategory) => {
        editForm.setData({
            name: category.name,
            status: category.status,
        });
        editForm.clearErrors();
        setEditingCategory(category);
    };

    const handleUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingCategory) return;

        editForm.put(route('deal.product-category.update', editingCategory.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCategory(null);
                editForm.reset();
                toast.success('Product category updated successfully!');
            },
            onError: () => {
                toast.error('Failed to update product category.');
            },
        });
    };

    // Delete
    const deleteCategory = (id: number) => {
        router.delete(route('deal.product-category.destroy', id), {
            onSuccess: () => toast.success('Product category deleted successfully!'),
            onError: () => toast.error('Failed to delete the product category.'),
        });
    };

    // Inline Status Change via Table Select
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

        router.patch(route('deal.product-category.updateStatus', id), { status: newStatus }, {
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

    return (
        <AppLayout breadcrumbs={[
            { title: 'Deals', href: '#' },
            { title: 'Product Categories', href: '/deal/product-category' }
        ]}>
            <Head title="Product Categories List" />

            <div className="m-5">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                Product Categories
                            </h1>
                            <Button
                                onClick={() => {
                                    createForm.reset();
                                    createForm.clearErrors();
                                    setIsCreateOpen(true);
                                }}
                                className="ml-auto flex items-center gap-1.5"
                            >
                                <Plus className="size-4" />
                                Create Category
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table<ProductCategory>
                            data={categories.data}
                            total={categories.total}
                            currentPage={categories.current_page}
                            rowsPerPage={categories.per_page}
                            columns={columns}
                            searchableKeys={['name']}
                            renderCell={(key, value, row) => {
                                if (key === 'name') {
                                    return (
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {row.name}
                                        </span>
                                    );
                                }

                                if (key === 'status') {
                                    const getStatusColor = (status: string) => {
                                        switch (status.toLowerCase()) {
                                            case 'active': return 'bg-green-100 text-green-800 hover:bg-green-200';
                                            case 'inactive': return 'bg-red-100 text-red-800 hover:bg-red-200';
                                            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
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
                                        <span className="text-gray-500 text-sm">
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
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => openEditModal(row)}
                                                title="Edit Category"
                                            >
                                                <Edit className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <ConfirmDialog
                                                title="Delete this Category?"
                                                description="Are you sure you want to delete this product category? This action cannot be undone."
                                                onConfirm={() => deleteCategory(row.id)}
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

            {/* Create Category Modal */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
                setIsCreateOpen(open);
                if (!open) {
                    createForm.reset();
                    createForm.clearErrors();
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Product Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="create-name">
                                Category Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="create-name"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="e.g. Earrings, Necklace, Ring"
                                disabled={createForm.processing}
                                required
                                autoFocus
                            />
                            <InputError message={createForm.errors.name} />
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="create-status">Status</Label>
                            <Select
                                value={createForm.data.status}
                                onValueChange={(val: 'active' | 'inactive') => createForm.setData('status', val)}
                                disabled={createForm.processing}
                            >
                                <SelectTrigger id="create-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={createForm.errors.status} />
                        </div>

                        <DialogFooter className="mt-5 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={createForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'Creating...' : 'Create Category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Category Modal */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => {
                if (!open) {
                    setEditingCategory(null);
                    editForm.reset();
                    editForm.clearErrors();
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Product Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="edit-name">
                                Category Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                placeholder="e.g. Earrings, Necklace, Ring"
                                disabled={editForm.processing}
                                required
                                autoFocus
                            />
                            <InputError message={editForm.errors.name} />
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                value={editForm.data.status}
                                onValueChange={(val: 'active' | 'inactive') => editForm.setData('status', val)}
                                disabled={editForm.processing}
                            >
                                <SelectTrigger id="edit-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={editForm.errors.status} />
                        </div>

                        <DialogFooter className="mt-5 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingCategory(null)}
                                disabled={editForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Updating...' : 'Update Category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Status Change Confirmation Dialog */}
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
        </AppLayout>
    );
}
