import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getAddresses, addAddress, deleteAddress } from '../lib/firestore';
import { Address } from '../types';
import { ArrowLeft, Plus, Trash2, MapPin, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AddressesScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { onSelect } = route.params || {};

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        label: 'Home',
        address_line1: '',
        address_line2: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '',
        landmark: '',
    });

    useEffect(() => {
        loadAddresses();
    }, [user]);

    const loadAddresses = async () => {
        if (!user) return;
        try {
            const data = await getAddresses(user.id);
            setAddresses(data);
        } catch (error) {
            console.error('Error loading addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async () => {
        if (!formData.address_line1 || !formData.pincode || !formData.city) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await addAddress({
                user_id: user?.id,
                ...formData,
                is_default: addresses.length === 0, // First one is default
            });
            setShowForm(false);
            setFormData({
                label: 'Home',
                address_line1: '',
                address_line2: '',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '',
                landmark: '',
            });
            loadAddresses();
        } catch (error) {
            console.error('Error adding address:', error);
            Alert.alert('Error', 'Failed to save address');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAddress(id);
                            loadAddresses();
                        } catch (error) {
                            console.error('Error deleting address:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleSelect = (address: Address) => {
        if (onSelect) {
            onSelect(address);
            navigation.goBack();
        }
    };

    const renderAddressItem = ({ item }: { item: Address }) => (
        <TouchableOpacity
            style={[styles.card, onSelect && styles.selectableCard]}
            onPress={() => handleSelect(item)}
            disabled={!onSelect}
        >
            <View style={styles.cardHeader}>
                <View style={styles.labelContainer}>
                    <MapPin size={16} color="#EAB308" />
                    <Text style={styles.label}>{item.label}</Text>
                    {item.is_default && <Text style={styles.defaultBadge}>Default</Text>}
                </View>
                {!onSelect && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.addressText}>{item.address_line1}</Text>
            {item.address_line2 && <Text style={styles.addressText}>{item.address_line2}</Text>}
            <Text style={styles.addressText}>{item.city}, {item.state} - {item.pincode}</Text>
            {item.landmark && <Text style={styles.landmark}>Landmark: {item.landmark}</Text>}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{onSelect ? 'Select Address' : 'My Addresses'}</Text>
                <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addButton}>
                    <Plus size={24} color="#EAB308" />
                </TouchableOpacity>
            </View>

            {showForm ? (
                <ScrollView style={styles.formContainer}>
                    <Text style={styles.formTitle}>Add New Address</Text>

                    <Text style={styles.inputLabel}>Label (e.g., Home, Work)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.label}
                        onChangeText={(text) => setFormData({ ...formData, label: text })}
                        placeholder="Home"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.inputLabel}>Address Line 1 *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.address_line1}
                        onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
                        placeholder="House No, Street Name"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.inputLabel}>Address Line 2</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.address_line2}
                        onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
                        placeholder="Area, Colony"
                        placeholderTextColor="#666"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.inputLabel}>City *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.inputLabel}>Pincode *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.pincode}
                                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                                keyboardType="numeric"
                                maxLength={6}
                            />
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>Landmark</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.landmark}
                        onChangeText={(text) => setFormData({ ...formData, landmark: text })}
                        placeholder="Near..."
                        placeholderTextColor="#666"
                    />

                    <View style={styles.formActions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowForm(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleAddAddress}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Address</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.listContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#EAB308" style={{ marginTop: 40 }} />
                    ) : addresses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MapPin size={48} color="#404040" />
                            <Text style={styles.emptyText}>No addresses saved yet.</Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => setShowForm(true)}
                            >
                                <Text style={styles.emptyButtonText}>Add New Address</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={addresses}
                            renderItem={renderAddressItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    addButton: {
        padding: 4,
    },
    listContainer: {
        flex: 1,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#171717',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#262626',
    },
    selectableCard: {
        borderColor: '#EAB308',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    defaultBadge: {
        backgroundColor: '#262626',
        color: '#A3A3A3',
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    addressText: {
        color: '#D4D4D4',
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 20,
    },
    landmark: {
        color: '#A3A3A3',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    formContainer: {
        flex: 1,
        padding: 20,
    },
    formTitle: {
        color: '#EAB308',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputLabel: {
        color: '#A3A3A3',
        fontSize: 12,
        marginBottom: 6,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontSize: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    formActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 20,
        marginBottom: 40,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#404040',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#EAB308',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#737373',
        fontSize: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#262626',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#404040',
    },
    emptyButtonText: {
        color: '#EAB308',
        fontWeight: 'bold',
    },
});
