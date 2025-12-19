import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProducts } from '../lib/firestore';
import { Product } from '../types';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function WishlistScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { wishlist, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const navigation = useNavigation<any>();

    useEffect(() => {
        loadWishlistProducts();
    }, [wishlist]);

    const loadWishlistProducts = async () => {
        setLoading(true);
        const allProducts = await getProducts();
        const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
        setProducts(wishlistProducts);
        setLoading(false);
    };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item.id)}
            >
                <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>

            <View style={styles.cardContent}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addToCart(item)}
                >
                    <ShoppingBag size={16} color="black" />
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EAB308" />
                </View>
            ) : products.length === 0 ? (
                <View style={styles.center}>
                    <Heart size={64} color="#333" />
                    <Text style={styles.emptyText}>Your wishlist is empty</Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Shop')}
                    >
                        <Text style={styles.browseButtonText}>Browse Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    list: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#171717',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#262626',
    },
    image: {
        width: '100%',
        height: 140,
        backgroundColor: '#262626',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        borderRadius: 20,
    },
    cardContent: {
        padding: 10,
    },
    category: {
        fontSize: 10,
        color: '#EAB308',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    productName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    price: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addButton: {
        backgroundColor: '#EAB308',
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    addButtonText: {
        color: 'black',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 18,
        marginTop: 16,
        marginBottom: 24,
    },
    browseButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#EAB308',
        borderRadius: 100,
    },
    browseButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
