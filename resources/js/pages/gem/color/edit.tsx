import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, GemColor } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormEventHandler, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { cn } from '@/lib/utils';

interface Props {
    gemColor: GemColor;
}

export default function Edit({ gemColor }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gem Management', href: '/gem/types' },
        { title: 'Gem Colors', href: '/gem/colors' },
        { title: `Edit Gem Color: ${gemColor.name}`, href: `/gem/colors/${gemColor.id}/edit` },
    ];

    const existingImageUrl = gemColor.full_image_path || (gemColor.image ? `/${gemColor.image}` : null);

    const [name, setName] = useState(gemColor.name);
    const [sortOrder, setSortOrder] = useState(gemColor.sort_order);
    const [status, setStatus] = useState<'active' | 'inactive'>(gemColor.status);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (fileOrFiles: any) => {
        if (errors.image) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.image;
                return next;
            });
        }

        if (!fileOrFiles) {
            // When user clears the new chosen file, cancel it and revert to existing image
            setNewImageFile(null);
        } else {
            const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
            if (file instanceof File) {
                setNewImageFile(file);
            }
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setErrors({});

        if (!name.trim()) {
            setErrors({ name: 'The color name is required.' });
            toast.error('Please enter a color name.');
            return;
        }

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', name.trim());
        formData.append('sort_order', sortOrder.toString());
        formData.append('status', status);

        // Only send a new image if the user uploaded one
        if (newImageFile) {
            formData.append('image', newImageFile);
        }

        setIsSubmitting(true);
        router.post(route('gem.colors.update', gemColor.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Color updated successfully!', { id: 'app-flash-toast' });
            },
            onError: (errs) => {
                setErrors(errs);
                toast.error('Failed to update Gem Color. Please review errors.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Gem Color - ${gemColor.name}`} />

            <div className="m-3 sm:m-5 min-w-0 flex flex-col gap-5">
                <div className="flex justify-end">
                    <Link
                        className={buttonVariants({ variant: 'default', className: 'mb-2' })}
                        href={route('gem.colors.index')}
                    >
                        Gem Colors List
                    </Link>
                </div>

                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle>Edit Gem Color</CardTitle>
                        <CardDescription>Update color swatch, name, or sorting order.</CardDescription>
                    </CardHeader>
                    <form noValidate onSubmit={handleSubmit}>
                        <CardContent className="space-y-5">
                            {/* Swatch Image using ImageUpload */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label>Swatch Image</Label>
                                    {newImageFile && existingImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setNewImageFile(null)}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            Reset to current image
                                        </button>
                                    )}
                                </div>
                                <ImageUpload
                                    value={newImageFile || existingImageUrl}
                                    onChange={handleImageChange}
                                    error={errors.image}
                                    allowRemoveExisting={false}
                                    className="max-w-sm"
                                />
                            </div>

                            {/* Color Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Color Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) {
                                            setErrors(prev => {
                                                const next = { ...prev };
                                                delete next.name;
                                                return next;
                                            });
                                        }
                                    }}
                                    className={cn(errors.name ? "border-destructive focus-visible:ring-destructive" : "")}
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Sort Order & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min={0}
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(val) => setStatus(val as 'active' | 'inactive')}
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
                                href={route('gem.colors.index')}
                                className={buttonVariants({ variant: 'outline' })}
                            >
                                Cancel
                            </Link>
                            <Button type="submit" disabled={isSubmitting} className="min-w-32">
                                {isSubmitting ? 'Saving...' : 'Update Gem Color'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
