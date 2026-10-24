import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    flash?: {
        success?: string | null;
        error?: string | null;
        time?: number;
    };
    notifications: {
        items: NotificationItem[];
        unread_count: number;
        resolved_count: number;
    } | null;
    [key: string]: unknown;
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    url: string | null;
    created_at: string | null;
    read_at: string | null;
    resolved_at: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string;
    role?: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface DynamicPage {
    id: number;
    page_title: string;
    page_slug: string;
    page_content: string;
    status: 'Active' | 'Inactive';
    created_at: string;
    updated_at: string;
}

export interface PaginatedDynamicPages {
    data: DynamicPage[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface DynamicPage {
    id: number;
    page_title: string;
    page_slug: string;
    page_content: string;
    status: 'Active' | 'Inactive';
    created_at: string;
    updated_at: string;
}

export interface PaginatedDynamicPages {
    data: DynamicPage[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface Faq {
    id: number;
    question: string;
    answer: string;
    type: 'buyer' | 'supplier' | 'both';
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface PaginatedFaqs {
    data: Faq[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface Review {
    id: number;
    jewelry_card_id: number;
    user_id: number;
    rating: number;
    comment: string;
    created_at: string;
    updated_at: string;
    user?: User;
    jewelry_card?: {
        id: number;
        company_name: string;
    };
}

export interface PaginatedReviews {
    data: Review[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface ProductCategory {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface PaginatedProductCategories {
    data: ProductCategory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface GemType {
    id: number;
    name: string;
    sort_order: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface PaginatedGemTypes {
    data: GemType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface GemColor {
    id: number;
    name: string;
    image: string;
    full_image_path?: string | null;
    sort_order: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface PaginatedGemColors {
    data: GemColor[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface GemShape {
    id: number;
    name: string;
    image: string;
    full_image_path?: string | null;
    sort_order: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface PaginatedGemShapes {
    data: GemShape[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export type GemRequestStatus = 'pending' | 'in_progress' | 'completed' | 'withdrawn';

export interface GemRequest {
    id: number;
    request_number: string;
    slug: string;
    user_id: number;
    gem_type_id: number;
    gem_shape_id?: number | null;
    gem_color_id?: number | null;
    reference_image?: string | null;
    reference_image_url?: string | null;
    size?: string | null;
    quantity: number;
    request_details?: string | null;
    status: GemRequestStatus;
    withdrawn_at?: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    gem_type?: GemType;
    gemType?: GemType;
    gem_shape?: GemShape | null;
    gemShape?: GemShape | null;
    gem_color?: GemColor | null;
    gemColor?: GemColor | null;
}

export interface PaginatedGemRequests {
    data: GemRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export type ProductStatus = 'active' | 'inactive' | 'sold' | 'expired' | 'pending_payment';
export type PaymentStatus = 'free' | 'paid' | 'unpaid' | 'failed';

export interface ProductInformationItem {
    topic: string;
    information: string;
}

export interface DealProduct {
    id: number;
    user_id?: number | null;
    product_category_id?: number | null;
    name: string;
    slug: string;
    product_type?: string | null;
    base_price: number | string;
    offer_price?: number | string | null;
    quantity: number;
    deal_duration?: string | null;
    expires_at?: string | null;
    description?: string | null;
    product_information?: ProductInformationItem[] | null;
    images?: string[] | null;
    image_urls?: string[];
    view_count: number;
    status: ProductStatus;
    payment_status: PaymentStatus;
    payment_fee: number | string;
    stripe_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
    created_at: string;
    updated_at: string;
    category?: ProductCategory | null;
    user?: User | null;
}

export interface PaginatedProducts {
    data: DealProduct[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}



