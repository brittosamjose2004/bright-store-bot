import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { User, MapPin, Phone, Save, LogOut, Package } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
    const { user, profile, refreshProfile, signOut, loading: authLoading } = useAuth();
    const navigation = useNavigation<any>();

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        alt_phone: '',
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: 'Chennai',
        pincode: '',
        email: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigation.replace('Login');
        }
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                alt_phone: profile.alt_phone || '',
                address_line1: profile.address_line1 || '',
                address_line2: profile.address_line2 || '',
                landmark: profile.landmark || '',
                city: profile.city || 'Chennai',
                pincode: profile.pincode || '',
                email: profile.email || '',
            });
        }
    }, [user, profile, authLoading]);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (!user) throw new Error('No user logged in');

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...formData,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            await refreshProfile();
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigation.replace('Home');
    };

    if (authLoading) {
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
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={styles.iconButton}>
                            <Package size={20} color="#EAB308" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                            <LogOut size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <User size={20} color="#EAB308" />
                            <Text style={styles.sectionTitle}>Personal Details</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.full_name}
                                onChangeText={(text) => handleChange('full_name', text)}
                                placeholder="John Doe"
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Alternative Phone (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.alt_phone}
                                onChangeText={(text) => handleChange('alt_phone', text)}
                                placeholder="+91 ..."
                                placeholderTextColor="#6B7280"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MapPin size={20} color="#EAB308" />
                                <Text style={styles.sectionTitle}>Delivery Address</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Addresses')}>
                                <Text style={styles.linkText}>Manage Book</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address Line 1</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.address_line1}
                                onChangeText={(text) => handleChange('address_line1', text)}
                                placeholder="House No, Street Name"
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address Line 2</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.address_line2}
                                onChangeText={(text) => handleChange('address_line2', text)}
                                placeholder="Area Name"
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Landmark</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.landmark}
                                    onChangeText={(text) => handleChange('landmark', text)}
                                    placeholder="Near..."
                                    placeholderTextColor="#6B7280"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Pincode</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.pincode}
                                    onChangeText={(text) => handleChange('pincode', text)}
                                    placeholder="600..."
                                    placeholderTextColor="#6B7280"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>City</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={formData.city}
                                editable={false}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSubmit}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={['#EAB308', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {saving ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <>
                                    <Save color="black" size={20} />
                                    <Text style={styles.saveButtonText}>Save Profile</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View >
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#262626',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EAB308',
    },
    signOutButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    iconButton: {
        padding: 8,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderRadius: 8,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#EAB308',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#A3A3A3',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 12,
        padding: 12,
        color: 'white',
        fontSize: 16,
    },
    disabledInput: {
        opacity: 0.5,
    },
    row: {
        flexDirection: 'row',
    },
    saveButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    saveButtonText: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkText: {
        color: '#EAB308',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
