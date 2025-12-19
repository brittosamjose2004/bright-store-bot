import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProducts } from '../lib/firestore';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Plus, Search, ShoppingBag, Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useWishlist } from '../context/WishlistContext';

export default function ShopScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { addToCart, items } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const navigation = useNavigation<any>();
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const updateLocalQuantity = (productId: string, change: number) => {
        setQuantities(prev => {
            const currentQty = prev[productId] || 1;
            const newQty = Math.max(1, currentQty + change);
            return { ...prev, [productId]: newQty };
        });
    };

    const categories = ['All', 'Vegetables', 'Fruits', 'Spices', 'Dry Fruits', 'Oils'];

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchQuery, selectedCategory, products]);

    const loadProducts = async () => {
        const data = await getProducts();
        setProducts(data);
        setFilteredProducts(data);
        setLoading(false);
    };

    const filterProducts = () => {
        let result = products;

        if (searchQuery) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'All') {
            result = result.filter(p => p.category === selectedCategory);
        }

        setFilteredProducts(result);
    };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.card}>
            <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.wishlistButton}
                onPress={() => isInWishlist(item.id) ? removeFromWishlist(item.id) : addToWishlist(item.id)}
            >
                <Heart
                    size={20}
                    color={isInWishlist(item.id) ? "#EF4444" : "white"}
                    fill={isInWishlist(item.id) ? "#EF4444" : "transparent"}
                />
            </TouchableOpacity>
            <View style={styles.cardContent}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price} <Text style={styles.unit}>/ kg</Text></Text>
                    <Text style={styles.wholesalePrice}>Wholesale: ₹{item.wholesalePrice} / kg</Text>
                </View>

                <View style={styles.quantityContainer}>
                    <View style={styles.quantityControls}>
                        <TouchableOpacity
                            onPress={() => updateLocalQuantity(item.id, -1)}
                            style={styles.qtyBtn}
                        >
                            <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantities[item.id] || 1}</Text>
                        <TouchableOpacity
                            onPress={() => updateLocalQuantity(item.id, 1)}
                            style={styles.qtyBtn}
                        >
                            <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, !item.inStock && styles.disabledButton]}
                        onPress={() => addToCart(item, quantities[item.id] || 1)}
                        disabled={!item.inStock}
                    >
                        <Text style={styles.addButtonText}>
                            {item.inStock ? 'Add' : 'Out'}
                        </Text>
                        {item.inStock && <Plus size={16} color="black" />}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Shop Collection</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Wishlist')}>
                        <Heart size={24} color="#EAB308" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
                        placeholderTextColor="#6B7280"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && styles.activeCategoryChip
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && styles.activeCategoryText
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EAB308" />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}
            )}

            {/* Floating Cart FAB */}
            {items.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{items.length}</Text>
                    </View>
                    <ShoppingBag color="black" size={24} />
                    <Text style={styles.fabText}>View Cart</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        padding: 16,
        paddingBottom: 0,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#EAB308',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#171717',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#262626',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        paddingVertical: 12,
        fontSize: 16,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: '#171717',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#262626',
    },
    activeCategoryChip: {
        backgroundColor: '#EAB308',
        borderColor: '#EAB308',
    },
    categoryText: {
        color: '#9CA3AF',
        fontWeight: '600',
    },
    activeCategoryText: {
        color: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingTop: 0,
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
    priceRow: {
        marginBottom: 8,
    },
    price: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    unit: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: 'normal',
    },
    wholesalePrice: {
        fontSize: 10,
        color: '#6B7280',
    },
    addButtonText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#262626',
        borderRadius: 6,
        padding: 2,
    },
    qtyBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnText: {
        color: '#A3A3A3',
        fontSize: 16,
        fontWeight: 'bold',
    },
    qtyText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        minWidth: 16,
        textAlign: 'center',
    },
    addButton: {
        flex: 1,
        backgroundColor: '#EAB308',
        paddingVertical: 6,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    disabledButton: {
        backgroundColor: '#404040',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        backgroundColor: '#EAB308',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#EAB308',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#EF4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    wishlistButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        borderRadius: 20,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
});
