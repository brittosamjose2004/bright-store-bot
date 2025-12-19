import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart, CartItem } from '../context/CartContext';
import { Trash2, Plus, Minus, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
    const { items, removeFromCart, updateQuantity, total, subtotal, discount, coupon, applyCoupon, removeCoupon, checkout, isOutstation, deliveryRequested, setDeliveryRequested } = useCart();
    const [couponCode, setCouponCode] = React.useState('');
    const [applyingCoupon, setApplyingCoupon] = React.useState(false);
    const [selectedAddress, setSelectedAddress] = React.useState<any>(null);
    const navigation = useNavigation<any>();

    const handleCheckout = async () => {
        if (deliveryRequested && !selectedAddress) {
            Alert.alert(
                'Delivery Address',
                'Using your default profile address. Do you want to select a different saved address?',
                [
                    { text: 'Use Default', onPress: () => checkout() },
                    { text: 'Select Address', onPress: () => navigation.navigate('Addresses', { onSelect: setSelectedAddress }) }
                ]
            );
        } else {
            await checkout(selectedAddress);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplyingCoupon(true);
        const success = await applyCoupon(couponCode);
        setApplyingCoupon(false);
        if (success) {
            Alert.alert('Success', 'Coupon applied successfully!');
            setCouponCode('');
        } else {
            Alert.alert('Error', 'Invalid coupon code or conditions not met.');
        }
    };

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.details}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>

                <View style={styles.controls}>
                    <View style={styles.quantityControl}>
                        <TouchableOpacity
                            onPress={() => updateQuantity(item.id, item.quantity - 1)}
                            style={styles.controlBtn}
                        >
                            <Minus size={16} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{item.quantity} kg</Text>
                        <TouchableOpacity
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                            style={styles.controlBtn}
                        >
                            <Plus size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => removeFromCart(item.id)}
                        style={styles.deleteBtn}
                    >
                        <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.headerTitle}>Your Cart</Text>

            {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Your cart is empty</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListFooterComponent={
                            <View>
                                <View style={styles.couponContainer}>
                                    {coupon ? (
                                        <View style={styles.appliedCoupon}>
                                            <Text style={styles.couponText}>
                                                Coupon Applied: <Text style={{ fontWeight: 'bold', color: '#EAB308' }}>{coupon.code}</Text>
                                            </Text>
                                            <TouchableOpacity onPress={removeCoupon}>
                                                <Text style={styles.removeCouponText}>Remove</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.couponInputRow}>
                                            <TextInput
                                                style={styles.couponInput}
                                                placeholder="Enter Coupon Code"
                                                placeholderTextColor="#6B7280"
                                                value={couponCode}
                                                onChangeText={setCouponCode}
                                                autoCapitalize="characters"
                                            />
                                            <TouchableOpacity
                                                style={styles.applyButton}
                                                onPress={handleApplyCoupon}
                                                disabled={applyingCoupon}
                                            >
                                                <Text style={styles.applyButtonText}>
                                                    {applyingCoupon ? '...' : 'Apply'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                {deliveryRequested && (
                                    <View style={styles.addressContainer}>
                                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                                        {selectedAddress ? (
                                            <View style={styles.selectedAddressCard}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                                                    <TouchableOpacity onPress={() => navigation.navigate('Addresses', { onSelect: setSelectedAddress })}>
                                                        <Text style={styles.changeAddressText}>Change</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={styles.addressText}>{selectedAddress.address_line1}, {selectedAddress.city} - {selectedAddress.pincode}</Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.selectAddressButton}
                                                onPress={() => navigation.navigate('Addresses', { onSelect: setSelectedAddress })}
                                            >
                                                <Text style={styles.selectAddressText}>Select from Address Book</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        }
                    />

                    <View style={styles.footer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>₹{subtotal}</Text>
                        </View>

                        {discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.discountLabel}>Discount</Text>
                                <Text style={styles.discountValue}>-₹{discount}</Text>
                            </View>
                        )}

                        <View style={[styles.totalRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#262626' }]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>₹{total}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.deliveryToggle}
                            onPress={() => setDeliveryRequested(!deliveryRequested)}
                        >
                            <View style={[styles.checkbox, deliveryRequested && styles.checkedCheckbox]}>
                                {deliveryRequested && <View style={styles.checkmark} />}
                            </View>
                            <Text style={styles.deliveryToggleText}>Request Home Delivery</Text>
                        </TouchableOpacity>

                        {deliveryRequested && isOutstation && (
                            <View style={styles.warningContainer}>
                                <Text style={styles.warningTitle}>⚠️ Outstation Delivery</Text>
                                <Text style={styles.warningText}>
                                    You are outside our local delivery area. Shipping charges will be calculated manually.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                            <MessageCircle color="#fff" size={24} />
                            <Text style={styles.checkoutText}>Order via WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#EAB308',
        padding: 16,
    },
    list: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#525252',
        fontSize: 18,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#171717',
        borderRadius: 12,
        marginBottom: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#262626',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#262626',
    },
    details: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    name: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    price: {
        color: '#EAB308',
        fontSize: 16,
        fontWeight: 'bold',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#262626',
        borderRadius: 8,
        padding: 4,
    },
    controlBtn: {
        padding: 4,
    },
    quantity: {
        color: '#fff',
        marginHorizontal: 12,
        fontWeight: 'bold',
    },
    deleteBtn: {
        padding: 8,
    },
    footer: {
        padding: 24,
        backgroundColor: '#171717',
        borderTopWidth: 1,
        borderTopColor: '#262626',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    totalLabel: {
        color: '#A3A3A3',
        fontSize: 18,
    },
    totalAmount: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    checkoutBtn: {
        backgroundColor: '#25D366',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    checkoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    warningContainer: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderColor: 'rgba(234, 179, 8, 0.2)',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    warningTitle: {
        color: '#EAB308',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    warningText: {
        color: '#EAB308',
        fontSize: 12,
    },
    deliveryToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#262626',
        borderRadius: 8,
    },
    deliveryToggleText: {
        color: '#fff',
        marginLeft: 12,
        fontWeight: '500',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#EAB308',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedCheckbox: {
        backgroundColor: '#EAB308',
    },
    checkmark: {
        width: 10,
        height: 10,
        backgroundColor: '#000',
        borderRadius: 2,
    },
    couponContainer: {
        marginTop: 16,
        marginBottom: 8,
    },
    couponInputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    couponInput: {
        flex: 1,
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontSize: 14,
    },
    applyButton: {
        backgroundColor: '#262626',
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#404040',
    },
    applyButtonText: {
        color: '#EAB308',
        fontWeight: 'bold',
    },
    appliedCoupon: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.2)',
    },
    couponText: {
        color: '#D4D4D4',
    },
    removeCouponText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#A3A3A3',
        fontSize: 14,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 14,
    },
    discountLabel: {
        color: '#22C55E',
        fontSize: 14,
    },
    discountValue: {
        color: '#22C55E',
        fontSize: 14,
        fontWeight: 'bold',
    },
    addressContainer: {
        marginTop: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        color: '#EAB308',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    selectAddressButton: {
        backgroundColor: '#262626',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#404040',
        alignItems: 'center',
    },
    selectAddressText: {
        color: '#EAB308',
        fontWeight: 'bold',
    },
    selectedAddressCard: {
        backgroundColor: '#171717',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EAB308',
    },
    addressLabel: {
        color: '#EAB308',
        fontWeight: 'bold',
        fontSize: 14,
    },
    changeAddressText: {
        color: '#A3A3A3',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    addressText: {
        color: '#D4D4D4',
        fontSize: 12,
        marginTop: 4,
    },
});
