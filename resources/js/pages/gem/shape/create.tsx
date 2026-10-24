import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormEventHandler, useState, ChangeEvent, DragEvent, MouseEvent } from 'react';
import { Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    nextSortOrder?: number;
}

interface ShapeRow {
    id: string;
    name: string;
    file: File | null;
    previewUrl: string | null;
    sort_order: number;
    status: 'active' | 'inactive';
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Gem Management', href: '/gem/types' },
    { title: 'Gem Shapes', href: '/gem/shapes' },
    { title: 'Gem Shape Create', href: '/gem/shapes/create' },
];

export default function Create({ nextSortOrder = 1 }: Props) {
    const [rows, setRows] = useState<ShapeRow[]>([
        { id: '1', name: '', file: null, previewUrl: null, sort_order: nextSortOrder, status: 'active' },
    ]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addRow = () => {
        const newId = Date.now().toString();
        setRows(prev => {
            const currentMax = prev.length > 0 ? Math.max(...prev.map(r => r.sort_order || 0)) : (nextSortOrder - 1);
            return [
                ...prev,
                { id: newId, name: '', file: null, previewUrl: null, sort_order: currentMax + 1, status: 'active' },
            ];
        });
    };

    const removeRow = (index: number) => {
        if (rows.length <= 1) {
            toast.error('At least one row is required.');
            return;
        }
        if (rows[index].previewUrl) {
            URL.revokeObjectURL(rows[index].previewUrl!);
        }
        setRows(prev => prev.filter((_, i) => i !== index));
        setErrors(prev => {
            const next = { ...prev };
            delete next[`items.${index}.name`];
            delete next[`items.${index}.image`];
            return next;
        });
    };

    const updateRow = (index: number, field: keyof ShapeRow, value: any) => {
        if (field === 'name' && errors[`items.${index}.name`]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[`items.${index}.name`];
                return next;
            });
        }
        setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };

    const setFileForRow = (index: number, file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, WEBP, SVG).');
            return;
        }

        if (errors[`items.${index}.image`]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[`items.${index}.image`];
                return next;
            });
        }

        setRows(prev => prev.map((row, i) => {
            if (i === index) {
                if (row.previewUrl) {
                    URL.revokeObjectURL(row.previewUrl);
                }
                const previewUrl = URL.createObjectURL(file);
                return { ...row, file, previewUrl };
            }
            return row;
        }));
    };

    const handleFileChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileForRow(index, file);
        }
    };

    const handleDrop = (index: number, e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverRowId(null);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            setFileForRow(index, file);
        }
    };

    const removeFile = (index: number, e?: MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        const row = rows[index];
        if (row.previewUrl) {
            URL.revokeObjectURL(row.previewUrl);
        }

        const inputEl = document.getElementById(`shape-file-${row.id}`) as HTMLInputElement | null;
        if (inputEl) {
            inputEl.value = '';
        }

        setRows(prev => prev.map((r, i) => i === index ? { ...r, file: null, previewUrl: null } : r));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        rows.forEach((row, index) => {
            if (!row.name.trim()) {
                newErrors[`items.${index}.name`] = 'The shape name is required.';
            }
            if (!row.file) {
                newErrors[`items.${index}.image`] = 'The shape cut image is required.';
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in all required fields.');
            return;
        }

        const formData = new FormData();
        rows.forEach((row, idx) => {
            formData.append(`items[${idx}][name]`, row.name.trim());
            formData.append(`items[${idx}][sort_order]`, row.sort_order.toString());
            formData.append(`items[${idx}][status]`, row.status);
            if (row.file) {
                formData.append(`items[${idx}][image]`, row.file);
            }
        });

        setIsSubmitting(true);
        router.post(route('gem.shapes.store'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Shape created successfully!', { id: 'app-flash-toast' });
            },
            onError: (serverErrors) => {
                setErrors(serverErrors);
                toast.error('Failed to create gem shape(s). Please review errors.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gem Shape Create" />

            <div className="m-3 sm:m-5 min-w-0 flex flex-col gap-5">
                <div className="flex justify-end">
                    <Link
                        className={buttonVariants({ variant: 'default', className: 'mb-2' })}
                        href={route('gem.shapes.index')}
                    >
                        Gem Shapes List
                    </Link>
                </div>

                <Card className="min-w-0">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle>Create Gem Shapes</CardTitle>
                                <CardDescription>
                                    Upload shape cut images and enter shape details below. Drag and drop images directly or click to browse.
                                </CardDescription>
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
                                const nameError = errors[`items.${index}.name`] || (index === 0 ? errors.name : undefined);
                                const imageError = errors[`items.${index}.image`] || (index === 0 ? errors.image : undefined);

                                return (
                                    <div
                                        key={row.id}
                                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-border"
                                    >
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <span className="text-xs font-semibold text-muted-foreground w-6 text-center">
                                                #{index + 1}
                                            </span>

                                            {/* Enlarged Consistent Drag & Drop Cut Image Upload Box */}
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={cn(
                                                        "relative w-32 sm:w-36 h-24 shrink-0 rounded-lg transition-colors",
                                                        imageError
                                                            ? "ring-2 ring-destructive"
                                                            : dragOverRowId === row.id
                                                                ? "ring-2 ring-primary ring-offset-1"
                                                                : ""
                                                    )}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setDragOverRowId(row.id);
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setDragOverRowId(null);
                                                    }}
                                                    onDrop={(e) => handleDrop(index, e)}
                                                >
                                                    {row.previewUrl ? (
                                                        <div className="relative w-32 sm:w-36 h-24 rounded-lg border border-border overflow-visible bg-white dark:bg-gray-950 p-1 shadow-xs flex items-center justify-center">
                                                            <img
                                                                src={row.previewUrl}
                                                                alt="shape"
                                                                className="w-full h-full object-contain rounded-md"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => removeFile(index, e)}
                                                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-transform hover:scale-110 shadow-sm z-30"
                                                                title="Delete image"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label
                                                            htmlFor={`shape-file-${row.id}`}
                                                            className={cn(
                                                                "w-32 sm:w-36 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors text-center p-2 bg-white dark:bg-gray-800",
                                                                imageError
                                                                    ? "border-destructive text-destructive bg-destructive/5"
                                                                    : dragOverRowId === row.id
                                                                        ? "border-primary bg-primary/10 text-primary"
                                                                        : "border-border hover:border-primary text-muted-foreground hover:text-primary"
                                                            )}
                                                            title="Click or drag and drop image"
                                                        >
                                                            <UploadCloud className="w-6 h-6 mb-1" />
                                                            <span className="text-xs font-semibold leading-tight">Upload Cut *</span>
                                                            <span className="text-[10px] text-muted-foreground mt-0.5">Click or drag & drop</span>
                                                        </label>
                                                    )}
                                                    <input
                                                        id={`shape-file-${row.id}`}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange(index, e)}
                                                    />
                                                </div>
                                                {imageError && (
                                                    <InputError message={imageError} className="text-[11px] mt-1 text-center max-w-[144px] leading-tight" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Shape Name */}
                                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <Input
                                                type="text"
                                                placeholder="Shape Name (e.g. Round Brilliant, Oval, Princess, Emerald, Cushion)"
                                                value={row.name}
                                                onChange={(e) => updateRow(index, 'name', e.target.value)}
                                                className={cn(nameError ? "border-destructive focus-visible:ring-destructive" : "")}
                                            />
                                            {nameError && <InputError message={nameError} className="mt-1" />}
                                        </div>

                                        {/* Sort Order */}
                                        <div className="w-full sm:w-28 shrink-0">
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="Sort"
                                                value={row.sort_order}
                                                onChange={(e) => updateRow(index, 'sort_order', parseInt(e.target.value) || 0)}
                                            />
                                        </div>

                                        {/* Status */}
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

                                        {/* Remove */}
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
                                Add Another Shape Row
                            </Button>

                            <div className="flex flex-col-reverse sm:flex-row items-center gap-2">
                                <Link className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })} href={route('gem.shapes.index')}>
                                    Cancel
                                </Link>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-36">
                                    {isSubmitting
                                        ? 'Saving...'
                                        : rows.length === 1
                                            ? 'Save Gem Shape'
                                            : `Save (${rows.length}) Gem Shapes`}
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
