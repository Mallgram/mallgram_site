import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    initialize,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };
};
