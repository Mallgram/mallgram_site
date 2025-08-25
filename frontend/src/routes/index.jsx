import React, { Suspense } from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Lazy load components for better performance
const HomePage = React.lazy(() => import('@/pages/home/HomePage'));
const ProductListing = React.lazy(() => import('@/pages/products/ProductListing'));
const ProductDetail = React.lazy(() => import('@/pages/products/ProductDetail'));
const SearchResults = React.lazy(() => import('@/pages/products/SearchResults'));
const CartPage = React.lazy(() => import('@/pages/cart/CartPage'));
const CheckoutPage = React.lazy(() => import('@/pages/checkout/CheckoutPage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const ProfilePage = React.lazy(() => import('@/pages/user/ProfilePage'));
const OrderHistory = React.lazy(() => import('@/pages/user/OrderHistory'));
const Wishlist = React.lazy(() => import('@/pages/user/Wishlist'));
const ContactPage = React.lazy(() => import('@/pages/contact/ContactPage'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AffiliateDashboard = React.lazy(() => import('@/pages/affiliate/AffiliateDashboard'));

// Event/Promo Pages
const ChristmasPromo = React.lazy(() => import('@/pages/events/ChristmasPromo'));
const ValentinesPromo = React.lazy(() => import('@/pages/events/ValentinesPromo'));
const BackToSchoolPromo = React.lazy(() => import('@/pages/events/BackToSchoolPromo'));

// Error Pages
const NotFound = React.lazy(() => import('@/pages/errors/NotFound'));

const Routes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RouterRoutes>
        {/* Redirect root to South Africa by default */}
        <Route path="/" element={<Navigate to="/za" replace />} />
        
        {/* Country-specific routes */}
        <Route path="/:country" element={<Layout />}>
          {/* Home */}
          <Route index element={<HomePage />} />
          
          {/* Authentication */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Products */}
          <Route path="products" element={<ProductListing />} />
          <Route path="products/:category" element={<ProductListing />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="search" element={<SearchResults />} />
          
          {/* Shopping */}
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          
          {/* User Account */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="wishlist" element={<Wishlist />} />
          
          {/* Contact & Support */}
          <Route path="contact" element={<ContactPage />} />
          
          {/* Event/Promo Pages */}
          <Route path="events/christmas" element={<ChristmasPromo />} />
          <Route path="events/valentines" element={<ValentinesPromo />} />
          <Route path="events/back-to-school" element={<BackToSchoolPromo />} />
          
          {/* Admin Dashboard */}
          <Route path="admin/*" element={<AdminDashboard />} />
          
          {/* Affiliate Dashboard */}
          <Route path="affiliate/*" element={<AffiliateDashboard />} />
        </Route>
        
        {/* Global routes (not country-specific) */}
        <Route path="/privacy" element={<div>Privacy Policy</div>} />
        <Route path="/terms" element={<div>Terms of Service</div>} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
    </Suspense>
  );
};

export default Routes;
