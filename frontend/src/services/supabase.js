import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const database = {
  // Products
  getProducts: async (filters = {}) => {
    let query = supabase.from('products').select(`
      *,
      product_retailers!inner(
        id,
        retailer_name,
        price,
        discount_price,
        stock_quantity,
        is_available
      )
    `);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.priceMin) {
      query = query.gte('product_retailers.price', filters.priceMin);
    }

    if (filters.priceMax) {
      query = query.lte('product_retailers.price', filters.priceMax);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getProduct: async (id) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_retailers!inner(
          id,
          retailer_name,
          price,
          discount_price,
          stock_quantity,
          is_available,
          shipping_cost,
          estimated_delivery_days
        )
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Orders
  createOrder: async (orderData) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    return { data, error };
  },

  getUserOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // User Events (Analytics)
  trackEvent: async (eventData) => {
    const { data, error } = await supabase
      .from('user_events')
      .insert([{
        ...eventData,
        timestamp: new Date().toISOString(),
      }]);

    return { data, error };
  },

  // Reviews
  addReview: async (reviewData) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    return { data, error };
  },

  getProductReviews: async (productId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    return { data, error };
  },
};

// Storage helpers
export const storage = {
  uploadFile: async (bucket, file, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    return { data, error };
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  deleteFile: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    return { data, error };
  },
};

export default supabase;
