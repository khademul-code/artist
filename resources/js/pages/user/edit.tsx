import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ImageUpload from '@/components/ImageUpload';
import InputError from '@/components/input-error';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff, Building2, User as UserIcon, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const CATEGORY_OPTIONS = [
    "Fine Jewelry",
    "Diamonds",
    "Pearls",
    "Gemstones",
    "Gold Jewelry",
    "Silver Jewelry",
    "Watches",
    "Bridal Jewelry",
    "Fashion Jewelry",
    "Packaging",
    "Technology",
    "Tools and Equipment",
    "Repair Services",
    "Other",
];

const COMPANY_TYPES = [
    "Wholeseller",
    "Retailer",
    "Manufacturer",
    "Designer",
    "Supplier",
    "Service Provider",
    "Trade Show",
    "Other",
];

interface CompanyInfo {
    id?: number;
    company_name: string | null;
    company_type: string | null;
    company_phone: string | null;
    company_address: string | null;
    business_category: string[] | null;
    sendcontact_link: string | null;
    zip_code: string | null;
    city: string | null;
    year_of_est: string | null;
    company_bio: string | null;
    status?: string;
    image: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: 'buyer' | 'supplier' | string;
    status: 'Active' | 'Inactive';
    company?: CompanyInfo[] | CompanyInfo | null;
}

type EditUserForm = {
    name: string;
    email: string;
    phone: string;
    password: string;
    avatar: File | null;
    role: 'buyer' | 'supplier';

    // Company info (supplier only)
    company_name: string;
    company_type: string;
    company_phone: string;
    company_address: string;
    city: string;
    zip_code: string;
    year_of_est: string;
    sendcontact_link: string;
    business_category: string[];
    company_bio: string;
    company_image: File | null;

    _method: string;
};

interface Props {
    user: User;
}

export default function Edit({ user }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'User Management',
            href: '/user',
        },
        {
            title: 'Edit User',
            href: `/user/${user.id}/edit`,
        },
    ];

    const initialCompany: CompanyInfo | null = Array.isArray(user.company)
        ? user.company[0] || null
        : user.company || null;

    const { data, setData, errors, post, processing } = useForm<EditUserForm>({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        avatar: null,
        role: (user.role as 'buyer' | 'supplier') || 'buyer',

        company_name: initialCompany?.company_name || '',
        company_type: initialCompany?.company_type || '',
        company_phone: initialCompany?.company_phone || '',
        company_address: initialCompany?.company_address || '',
        city: initialCompany?.city || '',
        zip_code: initialCompany?.zip_code || '',
        year_of_est: initialCompany?.year_of_est || '',
        sendcontact_link: initialCompany?.sendcontact_link || '',
        business_category: Array.isArray(initialCompany?.business_category)
            ? initialCompany.business_category
            : [],
        company_bio: initialCompany?.company_bio || '',
        company_image: null,

        _method: 'PUT',
    });

    const [avatarRemoved, setAvatarRemoved] = useState(false);
    const [companyImageRemoved, setCompanyImageRemoved] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const updateUser: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('user.update', user.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User updated successfully!');
            },
            onError: () => {
                toast.error('Failed to update User. Please check errors.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit User - ${user.name}`} />
            <div className="m-5 flex flex-col gap-5">
                <div className="flex">
                    <Link className={buttonVariants({ variant: 'default', className: 'mb-2 ml-auto' })} href={route('user.index')}>
                        Back to List
                    </Link>
                </div>

                <form onSubmit={updateUser} className="space-y-6">
                    {/* User Account Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>Update account details and role for {user.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Role Selection */}
                                <div className="flex flex-col space-y-1.5 md:col-span-2">
                                    <Label htmlFor="role">User Role <span className="text-red-500">*</span></Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div
                                            onClick={() => setData('role', 'buyer')}
                                            className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3 ${
                                                data.role === 'buyer'
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                                                    : 'border-border hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${data.role === 'buyer' ? 'bg-blue-500 text-white' : 'bg-muted'}`}>
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-sm">Buyer</h4>
                                                    {data.role === 'buyer' && <Check className="w-4 h-4 text-blue-600" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Standard customer account to browse catalog and connect with vendors.
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setData('role', 'supplier')}
                                            className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3 ${
                                                data.role === 'supplier'
                                                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                                                    : 'border-border hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${data.role === 'supplier' ? 'bg-amber-500 text-white' : 'bg-muted'}`}>
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-sm">Supplier</h4>
                                                    {data.role === 'supplier' && <Check className="w-4 h-4 text-amber-600" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Vendor profile with company details and jewelry showcases.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <InputError message={errors.role} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter full name"
                                        disabled={processing}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="user@example.com"
                                        disabled={processing}
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+1 555-0199"
                                        disabled={processing}
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="password">Password (Leave blank to keep unchanged)</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Enter new password"
                                            disabled={processing}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex flex-col space-y-1.5 md:col-span-2">
                                    <Label htmlFor="avatar">User Avatar</Label>
                                    <ImageUpload
                                        value={data.avatar || (!avatarRemoved && user.avatar ? user.avatar : null)}
                                        onChange={(val) => {
                                            setData('avatar', val as File | null);
                                            setAvatarRemoved(!val);
                                        }}
                                        multiple={false}
                                    />
                                    <InputError message={errors.avatar} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Information Card (Only for Supplier) */}
                    {data.role === 'supplier' && (
                        <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/20 to-transparent dark:from-amber-950/10">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Company Information</CardTitle>
                                        <CardDescription>
                                            Update company details for this supplier profile
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                                        <Label htmlFor="company_image">Company Logo / Image</Label>
                                        <ImageUpload
                                            value={
                                                data.company_image ||
                                                (!companyImageRemoved && initialCompany?.image
                                                    ? initialCompany.image
                                                    : null)
                                            }
                                            onChange={(val) => {
                                                setData('company_image', val as File | null);
                                                setCompanyImageRemoved(!val);
                                            }}
                                            multiple={false}
                                        />
                                        <InputError message={errors.company_image} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <Input
                                            id="company_name"
                                            value={data.company_name}
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            placeholder="e.g. Royal Gems & Jewelry Co."
                                            disabled={processing}
                                        />
                                        <InputError message={errors.company_name} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="company_type">Company Type</Label>
                                        <Select
                                            value={data.company_type}
                                            onValueChange={(val) => setData('company_type', val)}
                                            disabled={processing}
                                        >
                                            <SelectTrigger id="company_type">
                                                <SelectValue placeholder="Select company type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COMPANY_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.company_type} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="company_phone">Company Phone</Label>
                                        <Input
                                            id="company_phone"
                                            value={data.company_phone}
                                            onChange={(e) => setData('company_phone', e.target.value)}
                                            placeholder="e.g. +1 800-555-0100"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.company_phone} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="year_of_est">Year Established</Label>
                                        <Input
                                            id="year_of_est"
                                            value={data.year_of_est}
                                            onChange={(e) => setData('year_of_est', e.target.value)}
                                            placeholder="e.g. 1998"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.year_of_est} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                                        <Label htmlFor="company_address">Street Address</Label>
                                        <Input
                                            id="company_address"
                                            value={data.company_address}
                                            onChange={(e) => setData('company_address', e.target.value)}
                                            placeholder="123 Jewelry District Ave, Suite 400"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.company_address} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="e.g. New York"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.city} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="zip_code">Zip / Postal Code</Label>
                                        <Input
                                            id="zip_code"
                                            value={data.zip_code}
                                            onChange={(e) => setData('zip_code', e.target.value)}
                                            placeholder="e.g. 10001"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.zip_code} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                                        <Label htmlFor="sendcontact_link">Mini Site / Contact Link</Label>
                                        <Input
                                            id="sendcontact_link"
                                            type="url"
                                            value={data.sendcontact_link}
                                            onChange={(e) => setData('sendcontact_link', e.target.value)}
                                            placeholder="https://example.com/company"
                                            disabled={processing}
                                        />
                                        <InputError message={errors.sendcontact_link} />
                                    </div>

                                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                                        <Label htmlFor="business_category">Business Categories</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-between font-normal h-auto min-h-10 py-2"
                                                    disabled={processing}
                                                >
                                                    {data.business_category && data.business_category.length > 0 ? (
                                                        <div className="flex gap-1 flex-wrap">
                                                            {data.business_category.map((cat) => (
                                                                <Badge variant="secondary" key={cat} className="flex items-center gap-1">
                                                                    {cat}
                                                                    <button
                                                                        type="button"
                                                                        className="hover:text-red-500 focus:outline-none"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setData(
                                                                                'business_category',
                                                                                data.business_category.filter((c) => c !== cat)
                                                                            );
                                                                        }}
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Select business categories</span>
                                                    )}
                                                    <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto">
                                                {CATEGORY_OPTIONS.map((cat) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={cat}
                                                        checked={data.business_category.includes(cat)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setData('business_category', [...data.business_category, cat]);
                                                            } else {
                                                                setData(
                                                                    'business_category',
                                                                    data.business_category.filter((c) => c !== cat)
                                                                );
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

                                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                                        <Label htmlFor="company_bio">Company Bio / Description</Label>
                                        <Textarea
                                            id="company_bio"
                                            value={data.company_bio}
                                            onChange={(e) => setData('company_bio', e.target.value)}
                                            placeholder="Write a brief overview of the company, specialties, and experience..."
                                            rows={4}
                                            disabled={processing}
                                        />
                                        <InputError message={errors.company_bio} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardFooter className="flex justify-between py-4">
                            <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update User
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
