import { supabase } from './supabase';
import { Product, Offer, Banner } from '../types';

export async function getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        wholesalePrice: item.wholesaleprice, // Map from DB
        category: item.category,
        imageUrl: item.imageurl, // Map from DB
        stock_quantity: item.stock_quantity,
        minWholesaleQuantity: item.minwholesalequantity,
        variants: item.variants || [], // Map to jsonb
        createdAt: item.created_at,
    })) as Product[];
}

export async function getOffers(): Promise<Offer[]> {
    const { data, error } = await supabase
        .from('offers')
        .select('*');

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        code: item.code,
        discountPercentage: item.discountpercentage, // Map from DB
        active: item.active,
    })) as Offer[];
}

export async function getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        wholesalePrice: data.wholesaleprice,
        category: data.category,
        imageUrl: data.imageurl,
        stock_quantity: data.stock_quantity,
        minWholesaleQuantity: data.minwholesalequantity,
        variants: data.variants || [],
        createdAt: data.created_at,
    } as Product;
}

// Reviews
export async function getReviews(productId: string) {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            profiles:user_id (
                full_name
            )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function addReview(review: { product_id: string; user_id: string; rating: number; comment: string }) {
    const { error } = await supabase
        .from('reviews')
        .insert([review]);

    if (error) throw error;
}

export async function getUserOrders(userId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getOrderById(orderId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error) throw error;
    return data;
}

export async function getBanners(): Promise<Banner[]> {
    const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.image_url,
        link: item.link,
        active: item.active,
        displayOrder: item.display_order,
    })) as Banner[];
}

// Addresses
export async function getAddresses(userId: string) {
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

    if (error) throw error;
    return data;
}

export async function addAddress(address: any) {
    const { error } = await supabase
        .from('addresses')
        .insert([address]);

    if (error) throw error;
}

export async function deleteAddress(id: string) {
    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
