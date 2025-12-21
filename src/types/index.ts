export interface VariantOption {
    label: string;
    priceModifier: number;
}

export interface Variant {
    name: string;
    options: VariantOption[];
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    wholesalePrice: number;
    minWholesaleQuantity: number;
    category: string;
    imageUrl: string;
    stock_quantity?: number;
    variants?: Variant[];
    createdAt: string;
}

export interface Offer {
    id: string;
    title: string;
    description: string;
    code: string;
    discountPercentage: number;
    active: boolean;
}

export interface Banner {
    id: string;
    title: string;
    imageUrl: string;
    link?: string;
    active: boolean;
    displayOrder: number;
}

export interface Address {
    id: string;
    user_id: string;
    label: string;
    full_name?: string;
    phone?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    is_default: boolean;
}
