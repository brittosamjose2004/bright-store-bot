import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WishlistContextType {
    wishlist: string[]; // Array of Product IDs
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
    wishlist: [],
    addToWishlist: async () => { },
    removeFromWishlist: async () => { },
    isInWishlist: () => false,
});

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const [wishlist, setWishlist] = useState<string[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadWishlist();
        } else {
            setWishlist([]);
        }
    }, [user]);

    const loadWishlist = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('wishlist')
            .select('product_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error loading wishlist:', error);
            return;
        }

        setWishlist(data.map((item: any) => item.product_id));
    };

    const addToWishlist = async (productId: string) => {
        if (!user) return;

        // Optimistic update
        setWishlist(prev => [...prev, productId]);

        const { error } = await supabase
            .from('wishlist')
            .insert({ user_id: user.id, product_id: productId });

        if (error) {
            console.error('Error adding to wishlist:', error);
            // Revert on error
            setWishlist(prev => prev.filter(id => id !== productId));
        }
    };

    const removeFromWishlist = async (productId: string) => {
        if (!user) return;

        // Optimistic update
        setWishlist(prev => prev.filter(id => id !== productId));

        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) {
            console.error('Error removing from wishlist:', error);
            // Revert on error
            setWishlist(prev => [...prev, productId]);
        }
    };

    const isInWishlist = (productId: string) => wishlist.includes(productId);

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
