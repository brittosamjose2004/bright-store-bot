import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Package, CheckCircle, Truck, MapPin, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getOrderById } from '../lib/firestore';

export default function OrderDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { order: initialOrder } = route.params;
    const [order, setOrder] = useState(initialOrder);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadOrderDetails = async () => {
        console.log('Fetching details for order:', initialOrder.id);
        try {
            const updatedOrder = await getOrderById(initialOrder.id);
            console.log('Fetched order data:', updatedOrder);
            if (updatedOrder) {
                console.log('Updating state with status:', updatedOrder.status);
                setOrder(updatedOrder);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadOrderDetails();
        }, [initialOrder.id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadOrderDetails();
    };

    const steps = [
        { key: 'pending', label: 'Order Placed', icon: Clock, description: 'Your order has been placed.' },
        { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Seller has confirmed your order.' },
        { key: 'shipped', label: 'Shipped', icon: Truck, description: 'Your order is on the way.' },
        { key: 'delivered', label: 'Delivered', icon: Package, description: 'Package delivered successfully.' },
    ];

    const getCurrentStepIndex = (status: string) => {
        const statusMap: { [key: string]: number } = {
            'pending': 0,
            'processing': 1, // Changed from 'confirmed' to match DB enum if needed, or map 'processing' -> 1
            'shipped': 2,
            'completed': 3, // 'completed' usually maps to delivered
            'cancelled': -1
        };
        // Handle 'confirmed' if it exists in DB, otherwise assume 'processing'
        if (status === 'confirmed') return 1;
        return statusMap[status] ?? 0;
    };

    const currentStep = getCurrentStepIndex(order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#000000']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EAB308" />
                    }
                >
                    {/* Order ID & Status */}
                    <View style={styles.section}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
                            <View style={[
                                styles.statusBadge,
                                isCancelled ? styles.bgRed : styles.bgYellow
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    isCancelled ? styles.textRed : styles.textYellow
                                ]}>
                                    {order.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.dateText}>
                            Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </Text>
                    </View>

                    {/* Timeline */}
                    {!isCancelled && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Order Status</Text>
                            <View style={styles.timeline}>
                                {steps.map((step, index) => {
                                    const isActive = index <= currentStep;
                                    const isLast = index === steps.length - 1;
                                    const Icon = step.icon;

                                    return (
                                        <View key={step.key} style={styles.timelineStep}>
                                            <View style={styles.timelineLeft}>
                                                <View style={[
                                                    styles.iconContainer,
                                                    isActive ? styles.activeIcon : styles.inactiveIcon
                                                ]}>
                                                    <Icon size={16} color={isActive ? '#000' : '#666'} />
                                                </View>
                                                {!isLast && (
                                                    <View style={[
                                                        styles.line,
                                                        isActive && index < currentStep ? styles.activeLine : styles.inactiveLine
                                                    ]} />
                                                )}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <Text style={[
                                                    styles.stepLabel,
                                                    isActive ? styles.activeText : styles.inactiveText
                                                ]}>{step.label}</Text>
                                                {isActive && (
                                                    <Text style={styles.stepDesc}>{step.description}</Text>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Items */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Items</Text>
                        {order.items?.map((item: any, index: number) => (
                            <View key={index} style={styles.itemRow}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemQty}>{item.quantity} kg x ₹{item.price}</Text>
                                </View>
                                <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Payment Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Details</Text>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Subtotal</Text>
                            <Text style={styles.paymentValue}>₹{order.subtotal || order.total_amount}</Text>
                        </View>
                        {order.discount > 0 && (
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Discount</Text>
                                <Text style={styles.discountValue}>-₹{order.discount}</Text>
                            </View>
                        )}
                        <View style={[styles.paymentRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₹{order.total_amount}</Text>
                        </View>
                    </View>

                    {/* Shipping Address */}
                    {order.shipping_address && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Shipping Address</Text>
                            <View style={styles.addressCard}>
                                <MapPin size={20} color="#EAB308" style={{ marginTop: 2 }} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.addressLabel}>{order.shipping_address.label || 'Home'}</Text>
                                    <Text style={styles.addressText}>
                                        {order.shipping_address.address_line1}
                                        {order.shipping_address.address_line2 ? `, ${order.shipping_address.address_line2}` : ''}
                                    </Text>
                                    <Text style={styles.addressText}>
                                        {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                                    </Text>
                                    {order.shipping_address.landmark && (
                                        <Text style={styles.landmarkText}>Landmark: {order.shipping_address.landmark}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
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
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#171717',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#262626',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateText: {
        color: '#A3A3A3',
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    bgYellow: { backgroundColor: 'rgba(234, 179, 8, 0.1)' },
    bgRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    textYellow: { color: '#EAB308' },
    textRed: { color: '#EF4444' },
    sectionTitle: {
        color: '#EAB308',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    // Timeline
    timeline: {
        paddingLeft: 8,
    },
    timelineStep: {
        flexDirection: 'row',
        marginBottom: 0,
        minHeight: 60,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    activeIcon: { backgroundColor: '#EAB308' },
    inactiveIcon: { backgroundColor: '#262626', borderWidth: 1, borderColor: '#404040' },
    line: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    activeLine: { backgroundColor: '#EAB308' },
    inactiveLine: { backgroundColor: '#262626' },
    timelineContent: {
        flex: 1,
        paddingBottom: 24,
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    activeText: { color: '#fff' },
    inactiveText: { color: '#666' },
    stepDesc: {
        color: '#A3A3A3',
        fontSize: 12,
    },
    // Items
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#262626',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    itemQty: {
        color: '#A3A3A3',
        fontSize: 12,
        marginTop: 2,
    },
    itemTotal: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Payment
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    paymentLabel: {
        color: '#A3A3A3',
        fontSize: 14,
    },
    paymentValue: {
        color: '#fff',
        fontSize: 14,
    },
    discountValue: {
        color: '#22C55E',
        fontSize: 14,
        fontWeight: 'bold',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#262626',
    },
    totalLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalValue: {
        color: '#EAB308',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Address
    addressCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressLabel: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    addressText: {
        color: '#A3A3A3',
        fontSize: 13,
        lineHeight: 18,
    },
    landmarkText: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
});
