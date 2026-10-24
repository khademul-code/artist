import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormEventHandler, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    nextSortOrder?: number;
}

interface TypeRow {
    id: string;
    name: string;
    sort_order: number;
    status: 'active' | 'inactive';
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Gem Management', href: '/gem/types' },
    { title: 'Gem Types', href: '/gem/types' },
    { title: 'Gem Type Create', href: '/gem/types/create' },
];

export default function Create({ nextSortOrder = 1 }: Props) {
    const [rows, setRows] = useState<TypeRow[]>([
        { id: '1', name: '', sort_order: nextSortOrder, status: 'active' },
    ]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addRow = () => {
        setRows(prev => {
            const currentMax = prev.length > 0 ? Math.max(...prev.map(i => i.sort_order || 0)) : (nextSortOrder - 1);
            return [
                ...prev,
                { id: Date.now().toString(), name: '', sort_order: currentMax + 1, status: 'active' },
            ];
        });
    };

    const removeRow = (index: number) => {
        if (rows.length <= 1) {
            toast.error('At least one row is required.');
            return;
        }
        setRows(prev => prev.filter((_, i) => i !== index));
        setErrors(prev => {
            const next = { ...prev };
            delete next[`items.${index}.name`];
            return next;
        });
    };

    const updateRow = (index: number, field: keyof TypeRow, value: any) => {
        if (field === 'name' && errors[`items.${index}.name`]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[`items.${index}.name`];
                return next;
            });
        }
        setRows(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        rows.forEach((row, index) => {
            if (!row.name.trim()) {
                newErrors[`items.${index}.name`] = 'The gem type name is required.';
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please enter a name for all gem types.');
            return;
        }

        setIsSubmitting(true);
        router.post(route('gem.types.store'), {
            items: rows.map(r => ({
                name: r.name.trim(),
                sort_order: r.sort_order,
                status: r.status,
            })),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Type created successfully!', { id: 'app-flash-toast' });
            },
            onError: (serverErrors) => {
                setErrors(serverErrors);
                toast.error('Failed to create gem type(s). Please review errors.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gem Type Create" />

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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle>Create Gem Types</CardTitle>
                                <CardDescription>Enter gem type details below. You can add one or more rows.</CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRow}
                                className="flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Add Row
                            </Button>
                        </div>
                    </CardHeader>

                    <form noValidate onSubmit={handleSubmit}>
                        <CardContent className="space-y-3">
                            {rows.map((row, index) => {
                                const rowError = errors[`items.${index}.name`] || (index === 0 ? errors.name : undefined);

                                return (
                                    <div
                                        key={row.id}
                                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-border"
                                    >
                                        <span className="text-xs font-semibold text-muted-foreground w-6 text-center self-start sm:self-center shrink-0">
                                            #{index + 1}
                                        </span>

                                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <Input
                                                type="text"
                                                placeholder="Gem Type Name (e.g. Diamond, Sapphire, Ruby, Emerald)"
                                                value={row.name}
                                                onChange={(e) => updateRow(index, 'name', e.target.value)}
                                                className={cn(rowError ? "border-destructive focus-visible:ring-destructive" : "")}
                                            />
                                            {rowError && <InputError message={rowError} className="mt-1" />}
                                        </div>

                                        <div className="w-full sm:w-28 shrink-0">
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="Sort"
                                                value={row.sort_order}
                                                onChange={(e) => updateRow(index, 'sort_order', parseInt(e.target.value) || 0)}
                                            />
                                        </div>

                                        <div className="w-full sm:w-32 shrink-0">
                                            <Select
                                                value={row.status}
                                                onValueChange={(val) => updateRow(index, 'status', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex justify-end sm:justify-start shrink-0">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRow(index)}
                                                disabled={rows.length <= 1}
                                                className={`text-muted-foreground ${rows.length > 1 ? 'hover:text-rose-600' : 'opacity-30 cursor-not-allowed'}`}
                                                title={rows.length <= 1 ? 'At least one row is required' : 'Remove row'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={addRow}
                                className="flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                Add Another Row
                            </Button>

                            <div className="flex flex-col-reverse sm:flex-row items-center gap-2">
                                <Link className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })} href={route('gem.types.index')}>
                                    Cancel
                                </Link>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-36">
                                    {isSubmitting
                                        ? 'Saving...'
                                        : rows.length === 1
                                            ? 'Save Gem Type'
                                            : `Save (${rows.length}) Gem Types`}
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
