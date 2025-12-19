import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowRight, ShoppingBag, User } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getBanners } from '../lib/firestore';
import { Banner } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadBanners();
    }, []);

    useEffect(() => {
        if (banners.length > 1) {
            const interval = setInterval(() => {
                const nextIndex = (activeIndex + 1) % banners.length;
                setActiveIndex(nextIndex);
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeIndex, banners.length]);

    const loadBanners = async () => {
        try {
            const data = await getBanners();
            setBanners(data);
        } catch (error) {
            console.error('Error loading banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderBanner = ({ item }: { item: Banner }) => (
        <View style={styles.bannerContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bannerOverlay}
            >
                <Text style={styles.bannerTitle}>{item.title}</Text>
                {item.link && (
                    <TouchableOpacity
                        style={styles.bannerButton}
                        onPress={() => navigation.navigate('Shop')}
                    >
                        <Text style={styles.bannerButtonText}>Shop Now</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.paginationContainer}>
            {banners.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        index === activeIndex ? styles.paginationDotActive : styles.paginationDotInactive,
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#000000']}
                style={StyleSheet.absoluteFill}
            />

            {/* Background Accents */}
            <View style={[styles.glow, { top: -100, left: -100, backgroundColor: 'rgba(234, 179, 8, 0.1)' }]} />
            <View style={[styles.glow, { bottom: -100, right: -100, backgroundColor: 'rgba(249, 115, 22, 0.1)' }]} />

            <SafeAreaView style={styles.content}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate(user ? 'Profile' : 'Login')}
                    >
                        <BlurView intensity={20} tint="dark" style={styles.iconGlass}>
                            <User color="#EAB308" size={24} />
                        </BlurView>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#EAB308" />
                    </View>
                ) : banners.length > 0 ? (
                    <View style={styles.carouselContainer}>
                        <FlatList
                            ref={flatListRef}
                            data={banners}
                            renderItem={renderBanner}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(event) => {
                                const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                                setActiveIndex(newIndex);
                            }}
                            keyExtractor={(item) => item.id}
                        />
                        {renderPagination()}
                    </View>
                ) : (
                    <>
                        <View style={styles.logoContainer}>
                            <BlurView intensity={20} tint="dark" style={styles.logoGlass}>
                                <Image source={require('../../assets/logo.png')} style={styles.logo} />
                            </BlurView>
                        </View>

                        <View style={styles.textContainer}>
                            <Text style={styles.title}>
                                Premium Quality,{'\n'}
                                <Text style={styles.highlight}>Unbeatable Prices</Text>
                            </Text>
                            <Text style={styles.subtitle}>
                                Experience the finest selection with our new weight-based pricing.
                            </Text>
                        </View>
                    </>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Shop')}
                    >
                        <LinearGradient
                            colors={['#EAB308', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.primaryButtonText}>Shop Now</Text>
                            <ArrowRight color="black" size={20} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <BlurView intensity={30} tint="light" style={styles.glassButton}>
                            <Text style={styles.secondaryButtonText}>View Cart</Text>
                            <ShoppingBag color="white" size={20} />
                        </BlurView>
                    </TouchableOpacity>
                </View>

                {/* Location Info */}
                <View style={styles.locationContainer}>
                    <Text style={styles.locationTitle}>Visit Us</Text>
                    <Text style={styles.locationText}>
                        46, Subhiksha Ave, Satya Nagar,{'\n'}
                        Lakshmi Nagar, Kovilambakkam,{'\n'}
                        Chennai, Tamil Nadu 600129
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBar: {
        position: 'absolute',
        top: 50,
        right: 24,
        zIndex: 10,
    },
    profileButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    iconGlass: {
        padding: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    carouselContainer: {
        height: 400,
        marginTop: 60,
        borderRadius: 24,
        overflow: 'hidden',
    },
    bannerContainer: {
        width: width - 48, // Padding 24 * 2
        height: 400,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingTop: 60,
    },
    bannerTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    bannerButton: {
        backgroundColor: '#EAB308',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    bannerButtonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    paginationDotActive: {
        backgroundColor: '#EAB308',
        width: 24,
    },
    paginationDotInactive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    logoGlass: {
        padding: 16,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 20,
    },
    textContainer: {
        marginTop: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 50,
        marginBottom: 16,
    },
    highlight: {
        color: '#EAB308',
    },
    subtitle: {
        fontSize: 18,
        color: '#A3A3A3',
        lineHeight: 26,
    },
    actions: {
        gap: 16,
        marginBottom: 20,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8,
    },
    primaryButtonText: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    glassButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    secondaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    locationContainer: {
        marginTop: 20,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    locationTitle: {
        color: '#EAB308',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    locationText: {
        color: '#A3A3A3',
        fontSize: 12,
        lineHeight: 18,
    },
});

