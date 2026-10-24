import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import InputError from '@/components/input-error';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useState, ChangeEvent } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jewelry Card Create',
        href: '/jewelry_card/create',
    },
];

export default function Create({ initialData }: { initialData?: any }) {
    const { data, setData, errors, post, reset, processing, transform } = useForm({
        image: null as File | null,
        mini_site_url: initialData?.mini_site_url || '',
        company_name: initialData?.company_name || '',
        company_type: initialData?.company_type || '',
        business_category: Array.isArray(initialData?.business_category) ? initialData.business_category : (initialData?.business_category ? [initialData.business_category] : []),
        trade_show: Array.isArray(initialData?.trade_show) ? initialData.trade_show : (initialData?.trade_show ? [initialData.trade_show] : []),
        booth_number: '',
        company_bio: initialData?.company_bio || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        city: initialData?.city || '',
        zip_code: initialData?.zip_code || '',
        company_information_id: initialData?.company_information_id || null,
    });

    const [imageRemoved, setImageRemoved] = useState(false);

    transform((data) => ({
        ...data,
        image: data.image || (!imageRemoved && initialData?.image ? initialData.image : null),
        business_category: data.business_category.length > 0 ? data.business_category : '',
        trade_show: data.trade_show.length > 0 ? data.trade_show : '',
    }));

    const createJewelryCard: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('jewelry_card.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset();
                toast.success('Jewelry Card created successfully!');
            },
            onError: () => {
                toast.error('Failed to create Jewelry Card.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jewelry Card Create" />
            <div className="m-5 flex flex-col gap-5">
                <div className="flex">
                    <Link className={(buttonVariants({ variant: 'default', className: 'mb-2 ml-auto' }))} href={route('jewelry_card.index')}>
                        Jewelry Cards List
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Jewelry Card</CardTitle>
                    </CardHeader>
                    <form onSubmit={createJewelryCard}>
                        <CardContent>
                            <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4">
                                
                                <div className="flex flex-col space-y-1.5 md:col-span-2">
                                    <Label htmlFor="image">Image <span className="text-red-500">*</span></Label>
                                    <ImageUpload
                                        value={data.image || (!imageRemoved && initialData.image ? initialData.image : null)}
                                        onChange={(val) => {
                                            setData('image', val as File | null);
                                            setImageRemoved(!val);
                                        }}
                                        multiple={false}
                                    />
                                    <InputError message={errors.image as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="mini_site_url">Mini Site Link <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="mini_site_url"
                                        type="url"
                                        value={data.mini_site_url}
                                        onChange={(e) => setData('mini_site_url', e.target.value)}
                                        placeholder="https://example.com"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.mini_site_url as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="company_name">Company Name</Label>
                                    <Input
                                        id="company_name"
                                        type="text"
                                        value={data.company_name}
                                        onChange={(e) => setData('company_name', e.target.value)}
                                        placeholder="e.g. David Yurman Jewelry"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.company_name as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="company_type">Company Type</Label>
                                    <Select
                                        value={data.company_type}
                                        onValueChange={(val) => setData("company_type", val)}
                                        disabled={processing}
                                        >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select company type" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="Wholeseller">Wholeseller</SelectItem>
                                            <SelectItem value="Retailer">Retailer</SelectItem>
                                            <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                                            <SelectItem value="Designer">Designer</SelectItem>
                                            <SelectItem value="Supplier">Supplier</SelectItem>
                                            <SelectItem value="Service Provider">Service Provider</SelectItem>
                                            <SelectItem value="Trade Show">Trade Show</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.company_type as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="business_category">Business Category</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="w-full justify-between font-normal h-auto min-h-10 py-2"
                                                disabled={processing}
                                            >
                                                {data.business_category && data.business_category.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {data.business_category.map((cat: string) => (
                                                            <Badge variant="secondary" key={cat} className="flex items-center gap-1">
                                                                {cat}
                                                                <button
                                                                    type="button"
                                                                    className="hover:text-red-500 focus:outline-none"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const currentCategories = Array.isArray(data.business_category) ? data.business_category : [];
                                                                        setData("business_category", currentCategories.filter((c: string) => c !== cat));
                                                                    }}
                                                                >
                                                                    &times;
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Select business category</span>
                                                )}
                                                <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                                            {[
                                                "Fine Jewelry", "Diamonds", "Pearls", "Gemstones", "Gold Jewelry", 
                                                "Silver Jewelry", "Watches", "Bridal Jewelry", "Fashion Jewelry", 
                                                "Packaging", "Technology", "Tools and Equipment", "Repair Services", "Other"
                                            ].map(cat => (
                                                <DropdownMenuCheckboxItem
                                                    key={cat}
                                                    checked={data.business_category?.includes(cat)}
                                                    onCheckedChange={(checked) => {
                                                        const currentCategories = Array.isArray(data.business_category) ? data.business_category : [];
                                                        if (checked) {
                                                            setData("business_category", [...currentCategories, cat]);
                                                        } else {
                                                            setData("business_category", currentCategories.filter((c: string) => c !== cat));
                                                        }
                                                    }}
                                                >
                                                    {cat}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <InputError message={errors.business_category as string} />
                                </div>

                                {/* <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="business_category">Business Category</Label>
                                    <Input
                                        id="business_category"
                                        type="text"
                                        value={data.business_category}
                                        onChange={(e) => setData('business_category', e.target.value)}
                                        placeholder="e.g. Diamonds, Pearls, Gold Jewelry"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.business_category as string} />
                                </div> */}


                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="trade_show">Trade Show</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="w-full justify-between font-normal h-auto min-h-10 py-2"
                                                disabled={processing}
                                            >
                                                {data.trade_show && data.trade_show.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {data.trade_show.map((show: string) => (
                                                            <Badge variant="secondary" key={show} className="flex items-center gap-1">
                                                                {show}
                                                                <button
                                                                    type="button"
                                                                    className="hover:text-red-500 focus:outline-none"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const currentShows = Array.isArray(data.trade_show) ? data.trade_show : [];
                                                                        setData("trade_show", currentShows.filter((s: string) => s !== show));
                                                                    }}
                                                                >
                                                                    &times;
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Select trade show</span>
                                                )}
                                                <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                                            {[
                                                "JCK", "IJO", "AJS", "RJO", "AGTA", "Other"
                                            ].map(show => (
                                                <DropdownMenuCheckboxItem
                                                    key={show}
                                                    checked={data.trade_show?.includes(show)}
                                                    onCheckedChange={(checked) => {
                                                        const currentShows = Array.isArray(data.trade_show) ? data.trade_show : [];
                                                        if (checked) {
                                                            setData("trade_show", [...currentShows, show]);
                                                        } else {
                                                            setData("trade_show", currentShows.filter((s: string) => s !== show));
                                                        }
                                                    }}
                                                >
                                                    {show}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <InputError message={errors.trade_show as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="booth_number">Booth Number</Label>
                                    <Input
                                        id="booth_number"
                                        type="text"
                                        value={data.booth_number}
                                        onChange={(e) => setData('booth_number', e.target.value)}
                                        placeholder="e.g. A123"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.booth_number as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@example.com"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.email as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+1 234 567 8900"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.phone as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="e.g. New York"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.city as string} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="zip_code">Zip Code</Label>
                                    <Input
                                        id="zip_code"
                                        type="text"
                                        value={data.zip_code}
                                        onChange={(e) => setData('zip_code', e.target.value)}
                                        placeholder="e.g. 10001"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.zip_code as string} />
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="123 Street Name, City, Country"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.address as string} />
                                </div>
                                <div className="flex flex-col space-y-1.5 md:col-span-2">
                                    <Label htmlFor="company_bio">Company Bio</Label>
                                    <Textarea
                                        id="company_bio"
                                        value={data.company_bio}
                                        onChange={(e) => setData('company_bio', e.target.value)}
                                        placeholder="About the company..."
                                        disabled={processing}
                                        rows={4}
                                    />
                                    <InputError message={errors.company_bio as string} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between mt-5">
                            <Button type="button" variant="outline" onClick={() => { reset(); }} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Create
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
