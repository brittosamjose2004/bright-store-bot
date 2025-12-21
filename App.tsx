import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';
import { View, StyleSheet, Dimensions } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ShopScreen from './src/screens/ShopScreen';
import CartScreen from './src/screens/CartScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import OrderDetailsScreen from './src/screens/OrderDetailsScreen';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator();

const DarkTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: '#000000',
        text: '#FFFFFF',
        card: '#171717',
        border: '#262626',
    },
};

function RootNavigator() {
    const { user, profile, loading } = useAuth();
    const navigation = useNavigation<any>();

    const isProfileComplete = user && profile && profile.phone && profile.address_line1;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#000000' },
                headerTintColor: '#EAB308',
            }}
        >
            {!user ? (
                // 1. Auth Stack (No User)
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            ) : !isProfileComplete ? (
                // 2. Incomplete Profile Stack (User logged in but missing details)
                // We lock them here until they save.
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: 'Complete Your Profile' }}
                />
            ) : (
                // 3. Main App Stack (User + Complete Profile)
                <>
                    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Shop" component={ShopScreen} />
                    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
                    <Stack.Screen name="Cart" component={CartScreen} />
                    <Stack.Screen name="Wishlist" component={WishlistScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="Orders" component={OrdersScreen} />
                    <Stack.Screen name="Addresses" component={AddressesScreen} />
                    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Video
                    source={require('./assets/mobile-intro.mp4')}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping={false}
                    onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded && status.didJustFinish) {
                            setIsLoading(false);
                        }
                    }}
                />
            </View>
        );
    }

    return (
        <AuthProvider>
            <NotificationProvider>
                <WishlistProvider>
                    <CartProvider>
                        <NavigationContainer theme={DarkTheme}>
                            <StatusBar style="light" />
                            <RootNavigator />
                        </NavigationContainer>
                    </CartProvider>
                </WishlistProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});
