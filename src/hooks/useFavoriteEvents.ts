import { useEffect, useState, useCallback } from 'react';
import type { Event } from '@/types/event';
import { favoriteApi } from '@/utils/apiClient';
import { useAuth } from '@/context/AuthContext';

export function useFavoriteEvents() {
  const [favorites, setFavorites] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth(); // Get auth loading state

  const fetchFavorites = useCallback(async () => {
    console.log('🚀 fetchFavorites called - user:', user ? 'authenticated' : 'not authenticated');
    
    // Don't fetch if auth is still loading or user is not authenticated
    if (authLoading || !user) {
      console.log('🛑 fetchFavorites: Auth loading or user not authenticated, returning early');
      if (!authLoading && !user) {
        setError('Please sign in to view your favorite events');
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching favorite events...');
      
      const data = await favoriteApi.getFavorites();
      console.log('✅ Favorite events fetched:', data.favorites?.length || 0);
      setFavorites(data.favorites || []);
      
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          setError('Please log in to view your favorite events');
        } else {
          setError(err.message);
        }
      } else {
        setError('Network error - please check your connection');
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  const toggleFavorite = async (eventId: string) => {
    // Don't proceed if auth is loading or user is not authenticated
    if (authLoading || !user) {
      setError('Please sign in to manage your favorites');
      return false;
    }

    try {
      console.log('🔄 Toggling favorite for event:', eventId);
      
      await favoriteApi.toggleFavorite(eventId);
      console.log('✅ Favorite toggled successfully');
      
      // Refetch favorites to get updated list
      await fetchFavorites();
      
    } catch (err) {
      console.error('❌ Error toggling favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  };

  useEffect(() => {
    console.log('🔍 useFavoriteEvents useEffect called - authLoading:', authLoading, 'user:', user ? 'authenticated' : 'not authenticated');
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }
    
    // Only fetch favorites if user is authenticated
    if (user) {
      console.log('✅ User authenticated, calling fetchFavorites...');
      fetchFavorites();
    } else {
      console.log('❌ User not authenticated, clearing data...');
      // User not authenticated, clear data and stop loading
      setFavorites([]);
      setError('Please sign in to view your favorite events');
      setLoading(false);
    }
  }, [user, authLoading, fetchFavorites]); // Depend on user, authLoading and memoized fetch

  const refetch = () => {
    fetchFavorites();
  };

  return { 
    favorites, 
    loading, 
    error, 
    refetch,
    toggleFavorite 
  };
}
