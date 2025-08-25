/**
 * Utility functions for Mallgram frontend
 */

// Price formatting
export const formatPrice = (price, country = 'za') => {
  if (country === 'za') {
    return `R${price.toLocaleString()}`;
  } else {
    return `${price.toLocaleString()} FCFA`;
  }
};

// Currency conversion (mock - replace with actual exchange rates)
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  const exchangeRates = {
    ZAR: 1,
    XAF: 30, // 1 ZAR = 30 XAF (approximate)
  };
  
  if (fromCurrency === toCurrency) return amount;
  
  const baseAmount = amount / exchangeRates[fromCurrency];
  return Math.round(baseAmount * exchangeRates[toCurrency]);
};

// Image URL helpers
export const getImageUrl = (path, bucket = 'products') => {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `/images/${bucket}/${path}`;
};

// Text truncation
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Slug generation
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// URL parameter helpers
export const getUrlParams = (url = window.location.search) => {
  return new URLSearchParams(url);
};

export const updateUrlParams = (params, replace = false) => {
  const searchParams = new URLSearchParams(window.location.search);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  });
  
  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
};

// Date formatting
export const formatDate = (date, locale = 'en-US') => {
  if (!date) return '';
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};

export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return '';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};

// Validation helpers
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone, country = 'za') => {
  const phoneRegexes = {
    za: /^(\+27|0)[0-9]{9}$/,
    cm: /^(\+237|237)[0-9]{8}$/,
  };
  
  return phoneRegexes[country]?.test(phone.replace(/\s/g, ''));
};

// Storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Random ID generator
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Color utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const getContrastColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Analytics helpers
export const trackEvent = (eventName, properties = {}) => {
  // Implementation will depend on analytics service
  console.log('Track event:', eventName, properties);
};

export const trackPageView = (page) => {
  // Implementation will depend on analytics service
  console.log('Track page view:', page);
};

// Performance helpers
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// Social sharing
export const shareOnSocial = (platform, url, text = '') => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText} ${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
  
  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  }
};
