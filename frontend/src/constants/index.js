/**
 * Application constants
 */

// Countries and their configurations
export const COUNTRIES = {
  ZA: {
    code: 'za',
    name: 'South Africa',
    currency: 'ZAR',
    currencySymbol: 'R',
    language: 'en',
    flag: '🇿🇦',
    phonePrefix: '+27',
  },
  CM: {
    code: 'cm',
    name: 'Cameroon',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    language: 'fr',
    flag: '🇨🇲',
    phonePrefix: '+237',
  },
};

// Product categories
export const CATEGORIES = [
  {
    id: 'electronics',
    name: 'Electronics',
    nameFr: 'Électronique',
    slug: 'electronics',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    nameFr: 'Mode',
    slug: 'fashion',
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    nameFr: 'Maison & Jardin',
    slug: 'home-garden',
  },
  {
    id: 'sports',
    name: 'Sports & Outdoors',
    nameFr: 'Sports & Plein Air',
    slug: 'sports',
  },
  {
    id: 'beauty',
    name: 'Beauty & Health',
    nameFr: 'Beauté & Santé',
    slug: 'beauty',
  },
  {
    id: 'books',
    name: 'Books & Media',
    nameFr: 'Livres & Médias',
    slug: 'books',
  },
];

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment methods
export const PAYMENT_METHODS = {
  ZA: [
    {
      id: 'paygate',
      name: 'PayGate',
      type: 'card',
      currencies: ['ZAR'],
      logo: '/images/payments/paygate.png',
    },
    {
      id: 'payfast',
      name: 'PayFast',
      type: 'card',
      currencies: ['ZAR'],
      logo: '/images/payments/payfast.png',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      type: 'card',
      currencies: ['ZAR'],
      logo: '/images/payments/card.png',
    },
  ],
  CM: [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      type: 'mobile',
      currencies: ['XAF'],
      logo: '/images/payments/mtn.png',
    },
    {
      id: 'orange',
      name: 'Orange Money',
      type: 'mobile',
      currencies: ['XAF'],
      logo: '/images/payments/orange.png',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      type: 'card',
      currencies: ['XAF'],
      logo: '/images/payments/card.png',
    },
  ],
};

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  AFFILIATE: 'affiliate',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: '/auth',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  USERS: '/users',
  PAYMENTS: '/payments',
  AI: '/ai',
  EMAILS: '/emails',
  ANALYTICS: '/analytics',
};

// Local storage keys
export const STORAGE_KEYS = {
  CART: 'cart-storage',
  AUTH: 'auth-storage',
  PREFERENCES: 'user-preferences',
  RECENT_SEARCHES: 'recent-searches',
  VIEWED_PRODUCTS: 'viewed-products',
};

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_ZA: /^(\+27|0)[0-9]{9}$/,
  PHONE_CM: /^(\+237|237)[0-9]{8}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// Social media links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/mallgram',
  TWITTER: 'https://twitter.com/mallgram',
  INSTAGRAM: 'https://instagram.com/mallgram',
  YOUTUBE: 'https://youtube.com/mallgram',
  LINKEDIN: 'https://linkedin.com/company/mallgram',
};

// App configuration
export const APP_CONFIG = {
  NAME: 'Mallgram',
  VERSION: '1.0.0',
  DESCRIPTION: 'Your Premier Online Shopping Destination in Africa',
  DEFAULT_COUNTRY: 'za',
  DEFAULT_LANGUAGE: 'en',
  ITEMS_PER_PAGE: 20,
  MAX_CART_ITEMS: 99,
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_DURATION: 4000,
};

// Feature flags
export const FEATURES = {
  AI_CHAT: true,
  ANALYTICS: true,
  NOTIFICATIONS: true,
  DARK_MODE: false,
  PWA: true,
  OFFLINE_MODE: false,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  PAYMENT_ERROR: 'Payment failed. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error. Please try again later.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  ITEM_ADDED_TO_CART: 'Item added to cart successfully!',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart.',
  ORDER_PLACED: 'Order placed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  EMAIL_SENT: 'Email sent successfully!',
  SUBSCRIPTION_SUCCESS: 'Subscription successful!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  REGISTRATION_SUCCESS: 'Registration successful!',
};

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  XS: 475,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
};

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  MODAL: 1050,
  TOOLTIP: 1070,
  TOAST: 1080,
  LOADING: 1090,
};

export default {
  COUNTRIES,
  CATEGORIES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  USER_ROLES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  VALIDATION_RULES,
  SOCIAL_LINKS,
  APP_CONFIG,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  BREAKPOINTS,
  ANIMATION_DURATION,
  Z_INDEX,
};
