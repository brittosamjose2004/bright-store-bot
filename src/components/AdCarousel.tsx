import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, FlatList, TouchableOpacity, Linking, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { Banner } from '../types';

const { width } = Dimensions.get('window');

export default function AdCarousel() {
    const [ads, setAds] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchAds();
    }, []);

    // Auto-scroll effect
    useEffect(() => {
        if (ads.length > 1) {
            const interval = setInterval(() => {
                const nextIndex = (currentIndex + 1) % ads.length;
                setCurrentIndex(nextIndex);
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
            }, 5000); // 5 seconds

            return () => clearInterval(interval);
        }
    }, [currentIndex, ads.length]);

    const fetchAds = async () => {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .eq('active', true)
            .order('display_order', { ascending: true });

        if (data) {
            // Map image_url (db) to imageUrl (type) if needed, or just use as is if Type is loose.
            // Our Type definition has `imageUrl`, DB has `image_url`. 
            // We'll map it to be safe.
            const mappedAds = data.map(ad => ({
                ...ad,
                imageUrl: ad.image_url // Ensure compatibility
            }));
            setAds(mappedAds);
        }
    };

    const handlePress = (link?: string) => {
        if (link) {
            Linking.openURL(link).catch(err => console.error("Couldn't load page", err));
        }
    };

    if (ads.length === 0) return null;

    const renderItem = ({ item }: { item: Banner }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(item.link)}
            style={styles.cardContainer}
        >
            <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
            />
            {item.title && (
                <View style={styles.textOverlay}>
                    <Text style={styles.titleText}>{item.title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={ads}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const index = Math.floor(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            {/* Dots Indicator */}
            {ads.length > 1 && (
                <View style={styles.dotsContainer}>
                    {ads.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                { backgroundColor: index === currentIndex ? '#EAB308' : 'rgba(255, 255, 255, 0.3)' }
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    cardContainer: {
        width: width - 32, // Full width minus padding
        height: 200,
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
    },
    titleText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
