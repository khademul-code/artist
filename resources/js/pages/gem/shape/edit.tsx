import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, GemShape } from '@/types';
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
    gemShape: GemShape;
}

export default function Edit({ gemShape }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gem Management', href: '/gem/types' },
        { title: 'Gem Shapes', href: '/gem/shapes' },
        { title: `Edit Gem Shape: ${gemShape.name}`, href: `/gem/shapes/${gemShape.id}/edit` },
    ];

    const existingImageUrl = gemShape.full_image_path || (gemShape.image ? `/${gemShape.image}` : null);

    const [name, setName] = useState(gemShape.name);
    const [sortOrder, setSortOrder] = useState(gemShape.sort_order);
    const [status, setStatus] = useState<'active' | 'inactive'>(gemShape.status);
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
            setErrors({ name: 'The shape name is required.' });
            toast.error('Please enter a shape name.');
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
        router.post(route('gem.shapes.update', gemShape.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gem Shape updated successfully!', { id: 'app-flash-toast' });
            },
            onError: (errs) => {
                setErrors(errs);
                toast.error('Failed to update Gem Shape. Please review errors.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Gem Shape - ${gemShape.name}`} />

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
                        <CardTitle>Edit Gem Shape</CardTitle>
                        <CardDescription>Update shape cut image, name, or sorting order.</CardDescription>
                    </CardHeader>
                    <form noValidate onSubmit={handleSubmit}>
                        <CardContent className="space-y-5">
                            {/* Shape Image using ImageUpload */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label>Shape Cut Image</Label>
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

                            {/* Shape Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Shape Name <span className="text-red-500">*</span></Label>
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
                                href={route('gem.shapes.index')}
                                className={buttonVariants({ variant: 'outline' })}
                            >
                                Cancel
                            </Link>
                            <Button type="submit" disabled={isSubmitting} className="min-w-32">
                                {isSubmitting ? 'Saving...' : 'Update Gem Shape'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
