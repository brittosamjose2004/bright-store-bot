import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../lib/firestore';
import { Package, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrdersScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadOrders();
        }, [user])
    );

    const loadOrders = async () => {
        if (!user) return;
        // Don't set loading true here to avoid flickering on every focus
        // Only set it if we don't have orders yet
        if (orders.length === 0) setLoading(true);

        try {
            const data = await getUserOrders(user.id);
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetails', { order: item })}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                    <Text style={styles.orderDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.statusContainer}>
                    <Text style={[
                        styles.statusText,
                        item.status === 'completed' ? styles.statusCompleted :
                            item.status === 'pending' ? styles.statusPending :
                                styles.statusCancelled
                    ]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderItems}>
                {item.items?.map((orderItem: any, index: number) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName}>
                            {orderItem.quantity}x {orderItem.name}
                        </Text>
                        <Text style={styles.itemPrice}>₹{orderItem.price * orderItem.quantity}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.totalAmount}>₹{item.total_amount}</Text>
                    <ChevronRight size={16} color="#666" />
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#EAB308" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#000000']}
                style={styles.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Orders</Text>
                    <View style={{ width: 24 }} />
                </View>

                {orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Package size={64} color="#404040" />
                        <Text style={styles.emptyText}>No orders yet</Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.shopButtonText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EAB308" />
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#262626',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#171717',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#262626',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderId: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    orderDate: {
        color: '#A3A3A3',
        fontSize: 12,
    },
    statusContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#262626',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusCompleted: { color: '#22C55E' },
    statusPending: { color: '#EAB308' },
    statusCancelled: { color: '#EF4444' },
    divider: {
        height: 1,
        backgroundColor: '#262626',
        marginVertical: 12,
    },
    orderItems: {
        gap: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemName: {
        color: '#D4D4D4',
        fontSize: 14,
    },
    itemPrice: {
        color: '#A3A3A3',
        fontSize: 14,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    totalLabel: {
        color: '#A3A3A3',
        fontSize: 14,
    },
    totalAmount: {
        color: '#EAB308',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#737373',
        fontSize: 18,
        marginTop: 16,
        marginBottom: 24,
    },
    shopButton: {
        backgroundColor: '#EAB308',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    shopButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
