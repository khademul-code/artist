import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, GemType } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormEventHandler } from 'react';

interface Props {
    gemType: GemType;
}

export default function Edit({ gemType }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gem Management', href: '/gem/types' },
        { title: 'Gem Types', href: '/gem/types' },
        { title: `Edit Gem Type: ${gemType.name}`, href: `/gem/types/${gemType.id}/edit` },
    ];

    const { data, setData, put, errors, processing } = useForm({
        name: gemType.name,
        sort_order: gemType.sort_order,
        status: gemType.status,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('gem.types.update', gemType.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Type updated successfully!', { id: 'app-flash-toast' });
            },
            onError: () => {
                toast.error('Failed to update Gem Type.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Gem Type - ${gemType.name}`} />

            <div className="m-3 sm:m-5 min-w-0 flex flex-col gap-5">
                <div className="flex justify-end">
                    <Link
                        className={buttonVariants({ variant: 'default', className: 'mb-2' })}
                        href={route('gem.types.index')}
                    >
                        Gem Types List
                    </Link>
                </div>

                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle>Edit Gem Type</CardTitle>
                        <CardDescription>Update gem type details below.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Gem Type Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(val) => setData('status', val as 'active' | 'inactive')}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2 border-t pt-4">
                            <Link
                                href={route('gem.types.index')}
                                className={buttonVariants({ variant: 'outline' })}
                            >
                                Cancel
                            </Link>
                            <Button type="submit" disabled={processing} className="min-w-32">
                                {processing ? 'Saving...' : 'Update Gem Type'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
