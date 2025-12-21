import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, VariantOption } from '../types';
import { Linking } from 'react-native';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';
import { supabase } from '../lib/supabase';

// Helper to generate unique ID for cart item (Product + Variants)
const getCartItemId = (productId: string, selectedVariants?: Record<string, VariantOption>) => {
    if (!selectedVariants || Object.keys(selectedVariants).length === 0) return productId;
    const variantString = Object.entries(selectedVariants)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, val]) => `${key}:${val.label}`)
        .join('|');
    return `${productId}-${variantString}`;
};

export interface CartItem extends Product {
    cartItemId: string; // Unique ID
    quantity: number;
    selectedVariants?: Record<string, VariantOption>;
    finalPrice: number; // Price including variants
}

export interface Coupon {
    code: string;
    discount_type: 'fixed' | 'percentage';
    value: number;
    min_order_amount: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number, selectedVariants?: Record<string, VariantOption>) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    checkout: (shippingAddress?: any) => Promise<void>;
    total: number;
    subtotal: number;
    discount: number;
    coupon: Coupon | null;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;
    isOutstation: boolean;
    deliveryRequested: boolean;
    setDeliveryRequested: (requested: boolean) => void;
}

const CartContext = createContext<CartContextType>({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    checkout: async () => { },
    total: 0,
    subtotal: 0,
    discount: 0,
    coupon: null,
    applyCoupon: async () => false,
    removeCoupon: () => { },
    isOutstation: false,
    deliveryRequested: false,
    setDeliveryRequested: () => { },
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const { profile, user } = useAuth();

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        saveCart();
    }, [items]);

    const loadCart = async () => {
        try {
            const savedCart = await AsyncStorage.getItem('cart');
            if (savedCart) {
                setItems(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error('Failed to load cart', error);
        }
    };

    const saveCart = async () => {
        try {
            await AsyncStorage.setItem('cart', JSON.stringify(items));
        } catch (error) {
            console.error('Failed to save cart', error);
        }
    };

    const addToCart = (product: Product, quantity: number = 1, selectedVariants?: Record<string, VariantOption>) => {
        const cartItemId = getCartItemId(product.id, selectedVariants);

        // Calculate final price based on variants
        let finalPrice = product.price;
        if (selectedVariants) {
            Object.values(selectedVariants).forEach(opt => finalPrice += opt.priceModifier);
        }

        setItems(current => {
            const existing = current.find(item => item.cartItemId === cartItemId);
            if (existing) {
                return current.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...current, {
                ...product,
                cartItemId,
                quantity,
                selectedVariants,
                finalPrice
            }];
        });
    };

    const removeFromCart = (cartItemId: string) => {
        setItems(current => current.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, quantity: number) => {
        if (quantity < 1) return;
        setItems(current =>
            current.map(item =>
                item.cartItemId === cartItemId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        setCoupon(null);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

    const discount = coupon ? (
        coupon.discount_type === 'percentage'
            ? (subtotal * coupon.value) / 100
            : coupon.value
    ) : 0;

    const total = Math.max(0, subtotal - discount);

    const applyCoupon = async (code: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('active', true)
                .single();

            if (error || !data) {
                return false;
            }

            if (subtotal < data.min_order_amount) {
                alert(`Minimum order amount for this coupon is ₹${data.min_order_amount}`);
                return false;
            }

            setCoupon(data);
            return true;
        } catch (error) {
            console.error('Error applying coupon:', error);
            return false;
        }
    };

    const removeCoupon = () => setCoupon(null);

    const [deliveryRequested, setDeliveryRequested] = useState(false);

    const LOCAL_PINCODES = ['600001', '600002', '600003', '600004', '600005'];
    const isOutstation = profile?.pincode ? !LOCAL_PINCODES.includes(profile.pincode) : false;

    const checkout = async (shippingAddress?: any) => {
        const phoneNumber = '918939479296';
        let message = `*New Order from Bright Store*\n\n`;

        const addressToUse = shippingAddress || profile;

        if (addressToUse) {
            message += `*Customer Details:*\n`;
            message += `Name: ${profile?.full_name || 'N/A'}\n`;
            message += `Phone: ${profile?.phone || 'N/A'}\n`;

            // ... (keep existing address formatting) ...
            if (shippingAddress) {
                message += `Address: ${shippingAddress.address_line1}, ${shippingAddress.address_line2 || ''}, ${shippingAddress.city} - ${shippingAddress.pincode}\n`;
                if (shippingAddress.landmark) message += `Landmark: ${shippingAddress.landmark}\n`;
            } else if (profile) {
                message += `Address: ${profile.address_line1}, ${profile.address_line2}, ${profile.city} - ${profile.pincode}\n`;
                if (profile.landmark) message += `Landmark: ${profile.landmark}\n`;
            }

            message += `\n*Order Type:* ${deliveryRequested ? '🚚 Delivery Requested' : '🏪 Store Pickup'}\n`;

            const pincode = shippingAddress ? shippingAddress.pincode : profile?.pincode;
            const isOutstationOrder = pincode ? !LOCAL_PINCODES.includes(pincode) : false;

            if (deliveryRequested && isOutstationOrder) {
                message += `⚠️ *Note:* Customer is outside local area. Extra shipping charges may apply.\n`;
            }
            message += `\n`;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                // Call Checkout API
                const response = await fetch(`${API_URL}/api/checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                    },
                    body: JSON.stringify({
                        items,
                        total,
                        subtotal,
                        discount,
                        coupon_code: coupon?.code,
                        user,
                        profile,
                        shippingAddress: shippingAddress || undefined,
                        deliveryRequested,
                    }),
                });

                if (!response.ok) {
                    console.error('Checkout API failed', await response.text());
                }
            } catch (error) {
                console.error('Error calling checkout API:', error);
            }
        }

        message += `*Order Items:*\n`;
        items.forEach(item => {
            const variantText = item.selectedVariants
                ? ` [${Object.values(item.selectedVariants).map(v => v.label).join(', ')}]`
                : '';
            message += `- ${item.name}${variantText} (${item.quantity} units): ₹${item.finalPrice * item.quantity}\n`;
        });

        message += `\n*Subtotal: ₹${subtotal}*`;
        if (discount > 0) {
            message += `\n*Discount: -₹${discount}*`;
        }
        message += `\n*Total Amount: ₹${total}*`;

        const pincode = shippingAddress ? shippingAddress.pincode : profile?.pincode;
        const isOutstationOrder = pincode ? !LOCAL_PINCODES.includes(pincode) : false;

        if (deliveryRequested && isOutstationOrder) {
            message += `\n(Plus Shipping Charges)`;
        }

        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                return Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
            }
        });
    };

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            checkout,
            total,
            subtotal,
            discount,
            coupon,
            applyCoupon,
            removeCoupon,
            isOutstation,
            deliveryRequested,
            setDeliveryRequested
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
