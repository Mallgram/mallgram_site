import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/services/supabase';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      
      // Actions
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        });
      },
      
      setSession: (session) => {
        set({ 
          session,
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          isLoading: false
        });
      },
      
      signIn: async (email, password) => {
        set({ isLoading: true });
        
        try {
          const { data, error } = await auth.signIn(email, password);
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { data, error: null };
        } catch (error) {
          set({ isLoading: false });
          return { data: null, error };
        }
      },
      
      signUp: async (email, password, userData = {}) => {
        set({ isLoading: true });
        
        try {
          const { data, error } = await auth.signUp(email, password, userData);
          
          if (error) throw error;
          
          // For email confirmation, user might be null
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.user,
            isLoading: false,
          });
          
          return { data, error: null };
        } catch (error) {
          set({ isLoading: false });
          return { data: null, error };
        }
      },
      
      signOut: async () => {
        set({ isLoading: true });
        
        try {
          const { error } = await auth.signOut();
          
          if (error) throw error;
          
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error };
        }
      },
      
      clearAuth: () => {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      // Initialize auth state
      initialize: async () => {
        set({ isLoading: true });
        
        try {
          const { data: { user } } = await auth.getCurrentUser();
          
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
          
          // Set up auth state change listener
          auth.onAuthStateChange((event, session) => {
            set({
              user: session?.user || null,
              session,
              isAuthenticated: !!session?.user,
              isLoading: false,
            });
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
