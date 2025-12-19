import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getReviews, addReview } from '../lib/firestore';
import { Star, User } from 'lucide-react-native';

interface Review {
    id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles?: {
        full_name: string;
    };
}

export default function ReviewSection({ productId }: { productId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        loadReviews();
    }, [productId]);

    const loadReviews = async () => {
        try {
            const data = await getReviews(productId);
            setReviews(data);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        if (!comment.trim()) return;

        try {
            await addReview({
                product_id: productId,
                user_id: user.id,
                rating,
                comment,
            });
            setComment('');
            setRating(5);
            loadReviews(); // Reload reviews
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review');
        }
    };

    const renderReviewItem = ({ item }: { item: Review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <User size={16} color="#9CA3AF" />
                    </View>
                    <Text style={styles.userName}>
                        {item.profiles?.full_name || 'Anonymous User'}
                    </Text>
                </View>
                <View style={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={14}
                            color={i < item.rating ? "#EAB308" : "#374151"}
                            fill={i < item.rating ? "#EAB308" : "transparent"}
                        />
                    ))}
                </View>
            </View>
            <Text style={styles.reviewComment}>{item.comment}</Text>
            <Text style={styles.reviewDate}>
                {new Date(item.created_at).toLocaleDateString()}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>

            {/* Review Form */}
            {user ? (
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Write a Review</Text>
                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                            >
                                <Star
                                    size={24}
                                    color={star <= rating ? "#EAB308" : "#4B5563"}
                                    fill={star <= rating ? "#EAB308" : "transparent"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Share your thoughts..."
                        placeholderTextColor="#6B7280"
                        style={styles.input}
                        multiline
                        numberOfLines={3}
                    />
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitButtonText}>Submit Review</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.loginPrompt}>
                    <Text style={styles.loginPromptText}>Please login to write a review.</Text>
                </View>
            )}

            {/* Reviews List */}
            {loading ? (
                <ActivityIndicator color="#EAB308" />
            ) : reviews.length === 0 ? (
                <Text style={styles.emptyText}>No reviews yet. Be the first to review!</Text>
            ) : (
                <View>
                    {reviews.map(item => (
                        <View key={item.id} style={{ marginBottom: 12 }}>
                            {renderReviewItem({ item })}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
    },
    formCard: {
        backgroundColor: '#171717',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#262626',
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#262626',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        textAlignVertical: 'top',
        minHeight: 80,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#EAB308',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loginPrompt: {
        backgroundColor: '#171717',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#262626',
        marginBottom: 24,
        alignItems: 'center',
    },
    loginPromptText: {
        color: '#9CA3AF',
    },
    reviewCard: {
        backgroundColor: '#171717',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#262626',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#262626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stars: {
        flexDirection: 'row',
    },
    reviewComment: {
        color: '#D1D5DB',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewDate: {
        color: '#6B7280',
        fontSize: 12,
    },
    emptyText: {
        color: '#6B7280',
        fontStyle: 'italic',
    },
});
