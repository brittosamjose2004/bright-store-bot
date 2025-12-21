import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getProductById } from '../lib/firestore';
import { Product, Variant, VariantOption } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingBag, Heart, ArrowLeft, Minus, Plus } from 'lucide-react-native';
import ReviewSection from '../components/ReviewSection';

export default function ProductDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { productId } = route.params;
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    // State for selected variants: { "Size": { label: "Large", priceModifier: 50 }, "Color": ... }
    const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantOption>>({});
    const [currentPrice, setCurrentPrice] = useState(0);

    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        loadProduct();
    }, [productId]);

    const loadProduct = async () => {
        const data = await getProductById(productId);
        setProduct(data);
        setCurrentPrice(data?.price || 0);

        // Initialize default variants (first option of each)
        if (data?.variants) {
            const defaults: Record<string, VariantOption> = {};
            data.variants.forEach(v => {
                if (v.options.length > 0) {
                    defaults[v.name] = v.options[0];
                }
            });
            setSelectedVariants(defaults);
        }
        setLoading(false);
    };

    // Update price when variants change
    useEffect(() => {
        if (!product) return;
        let base = product.price;
        Object.values(selectedVariants).forEach(opt => {
            base += opt.priceModifier;
        });
        setCurrentPrice(base);
    }, [selectedVariants, product]);

    const handleVariantSelect = (variantName: string, option: VariantOption) => {
        setSelectedVariants(prev => ({
            ...prev,
            [variantName]: option
        }));
    };

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(product, quantity, selectedVariants);
        // Optional: Show feedback
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#EAB308" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Product not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>

                {/* Image */}
                <Image source={{ uri: product.imageUrl }} style={styles.image} />

                <View style={styles.content}>
                    {/* Title & Wishlist */}
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.category}>{product.category}</Text>
                            <Text style={styles.title}>{product.name}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.wishlistButton}
                            onPress={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product.id)}
                        >
                            <Heart
                                size={24}
                                color={isInWishlist(product.id) ? "#EF4444" : "white"}
                                fill={isInWishlist(product.id) ? "#EF4444" : "transparent"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{currentPrice}</Text>
                        <Text style={styles.unit}>/ unit</Text>
                    </View>

                    {/* Wholesale Info & Stock */}
                    <View style={styles.wholesaleCard}>
                        <Text style={styles.wholesaleText}>
                            Wholesale: <Text style={{ color: 'white' }}>₹{product.wholesalePrice}</Text> / kg
                        </Text>
                        <Text style={styles.wholesaleSubtext}>
                            Min Order: {product.minWholesaleQuantity} kg
                        </Text>

                        <View style={[styles.stockBadge, (product.stock_quantity || 0) > 0 ? styles.stockIn : styles.stockOut]}>
                            <Text style={[styles.stockText, (product.stock_quantity || 0) > 0 ? styles.stockTextIn : styles.stockTextOut]}>
                                {(product.stock_quantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                            </Text>
                            {(product.stock_quantity || 0) < 5 && (product.stock_quantity || 0) > 0 && (
                                <Text style={styles.lowStockText}>Only {product.stock_quantity} left!</Text>
                            )}
                        </View>
                    </View>

                    {/* Variant Selectors */}
                    {product.variants && product.variants.length > 0 && (
                        <View style={styles.variantsContainer}>
                            {product.variants.map((variant, index) => (
                                <View key={index} style={styles.variantGroup}>
                                    <Text style={styles.variantTitle}>{variant.name}</Text>
                                    <View style={styles.optionsGrid}>
                                        {variant.options.map((option, optIndex) => {
                                            const isSelected = selectedVariants[variant.name]?.label === option.label;
                                            return (
                                                <TouchableOpacity
                                                    key={optIndex}
                                                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                                                    onPress={() => handleVariantSelect(variant.name, option)}
                                                >
                                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                                        {option.label}
                                                    </Text>
                                                    {option.priceModifier !== 0 && (
                                                        <Text style={[styles.priceMod, isSelected && styles.priceModSelected]}>
                                                            {option.priceModifier > 0 ? '+' : ''}{option.priceModifier}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Description */}
                    <Text style={styles.description}>{product.description}</Text>

                    {/* Quantity & Add to Cart */}
                    <View style={styles.actionRow}>
                        <View style={[styles.quantityControl, (product.stock_quantity || 0) === 0 && { opacity: 0.5 }]}>
                            <TouchableOpacity
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                style={styles.qtyButton}
                                disabled={(product.stock_quantity || 0) === 0}
                            >
                                <Minus size={20} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{quantity}</Text>
                            <TouchableOpacity
                                onPress={() => setQuantity(Math.min((product.stock_quantity || 0), quantity + 1))}
                                style={styles.qtyButton}
                                disabled={(product.stock_quantity || 0) === 0 || quantity >= (product.stock_quantity || 0)}
                            >
                                <Plus size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.addToCartButton, (product.stock_quantity || 0) === 0 && styles.disabledButton]}
                            onPress={handleAddToCart}
                            disabled={(product.stock_quantity || 0) === 0}
                        >
                            <ShoppingBag size={20} color={(product.stock_quantity || 0) > 0 ? "black" : "#666"} />
                            <Text style={[styles.addToCartText, (product.stock_quantity || 0) === 0 && { color: '#666' }]}>
                                {(product.stock_quantity || 0) > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Reviews */}
                    <ReviewSection productId={product.id} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
    },
    image: {
        width: '100%',
        height: 300,
        backgroundColor: '#171717',
    },
    content: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    category: {
        color: '#EAB308',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    wishlistButton: {
        padding: 8,
        backgroundColor: '#171717',
        borderRadius: 20,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    price: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },
    unit: {
        color: '#9CA3AF',
        fontSize: 16,
        marginLeft: 4,
    },
    wholesaleCard: {
        backgroundColor: '#171717',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#262626',
        marginBottom: 20,
    },
    wholesaleText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginBottom: 2,
    },
    wholesaleSubtext: {
        color: '#6B7280',
        fontSize: 12,
    },
    description: {
        color: '#D1D5DB',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#171717',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#262626',
    },
    qtyButton: {
        padding: 12,
    },
    qtyText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center',
    },
    addToCartButton: {
        flex: 1,
        backgroundColor: '#EAB308',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addToCartText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 16,
    },
    backLink: {
        color: '#EAB308',
        fontSize: 16,
    },
    stockBadge: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stockIn: {},
    stockOut: {},
    stockText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    stockTextIn: {
        color: '#22c55e',
    },
    stockTextOut: {
        color: '#ef4444',
    },
    lowStockText: {
        color: '#f97316',
        fontSize: 12,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#262626',
    },
    variantsContainer: {
        marginBottom: 24,
    },
    variantGroup: {
        marginBottom: 16,
    },
    variantTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    optionChipSelected: {
        backgroundColor: '#EAB308',
        borderColor: '#EAB308',
    },
    optionText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    optionTextSelected: {
        color: 'black',
        fontWeight: 'bold',
    },
    priceMod: {
        fontSize: 12,
        color: '#666',
    },
    priceModSelected: {
        color: '#000',
    }
});
