import { favoriteApi } from '@/utils/apiClient';

/**
 * Utility functions for favorites
 */
export const favoriteUtils = {
  /**
   * Check if an event is favorited by the current user
   */
  async checkFavoriteStatus(eventId: string): Promise<boolean> {
    try {
      const response = await favoriteApi.checkFavoriteStatus(eventId);
      return response.isFavorite || false;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  },

  /**
   * Toggle favorite status for an event
   */
  async toggleFavorite(eventId: string): Promise<{ action: 'added' | 'removed' }> {
    try {
      const response = await favoriteApi.toggleFavorite(eventId);
      return response;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }
};
