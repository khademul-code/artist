import AppLayout from '@/layouts/app-layout';
import { PaginatedReviews, Review } from '@/types';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import Table from '@/components/Table';
import { buttonVariants } from '@/components/ui/button';
import { Trash, Gem } from 'lucide-react';
import { AlertDialog } from "@heroui/react";
import { ConfirmDialog } from '@/components/alert-dialog';
import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"

interface Props {
    reviews: PaginatedReviews;
}

const columns = [
    { label: 'User', key: 'user' },
    { label: 'Company', key: 'company' },
    { label: 'Rating', key: 'rating', sortable: true },
    { label: 'Comment', key: 'comment', sortable: true },
    { label: 'Actions', key: 'actions' },
];

export default function Index({ reviews }: Props) {
    const queryParams = new URLSearchParams(window.location.search);
    const search = queryParams.get('search') || '';
    const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

    const deleteReview = (id: number) => {
        router.delete(route('review.destroy', id), {
            onSuccess: () => toast.success('Review deleted successfully!'),
            onError: () => toast.error('Failed to delete the review.'),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Reviews', href: '/review' }]}>
            <Head title="Reviews List" />

            <div className="m-5">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                Reviews List
                            </h1>
                            <div className="ml-auto flex items-center gap-2">
                                {selectedKeys.length > 0 && (
                                    <ConfirmDialog
                                        title="Delete Selected Reviews?"
                                        description={`Are you sure you want to delete ${selectedKeys.length} reviews? This action cannot be undone.`}
                                        onConfirm={() => {
                                            router.post(route('review.bulkDestroy'), { ids: selectedKeys }, {
                                                onSuccess: () => {
                                                    toast.success('Selected reviews deleted successfully!');
                                                    setSelectedKeys([]);
                                                },
                                                onError: () => toast.error('Failed to delete reviews.'),
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
                        <Table<Review>
                            data={reviews.data}
                            total={reviews.total}
                            currentPage={reviews.current_page}
                            rowsPerPage={reviews.per_page}
                            columns={columns}
                            searchableKeys={['comment']}
                            selectable={true}
                            selectedKeys={selectedKeys}
                            onSelectionChange={(keys) => setSelectedKeys(keys as number[])}
                            primaryKey="id"
                            renderCell={(key, value, row) => {
                                if (key === 'user') {
                                    return row.user?.name || '-';
                                }

                                if (key === 'company') {
                                    return row.jewelry_card?.company_name || '-';
                                }

                                if (key === 'rating') {
                                    return (
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Gem key={i} className={`w-4 h-4 ${i < row.rating ? 'text-cyan-500 fill-cyan-500' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    );
                                }

                                if (key === 'comment') {
                                    return (
                                        <div className="max-w-md truncate" title={row.comment}>
                                            {row.comment}
                                        </div>
                                    );
                                }

                                if (key === 'actions') {
                                    return (
                                        <div className="flex gap-2">
                                            <ConfirmDialog
                                                title="Delete this review?"
                                                description="Are you sure you want to delete this review? This action cannot be undone."
                                                onConfirm={() => deleteReview(row.id)}
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
