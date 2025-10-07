"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Heart, 
  Star, 
  MapPin, 
  Clock, 
  Users,
  Settings,
  Bell,
  Ticket,
  TrendingUp,
  Filter,
  Eye,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  venue?: string;
  location?: string;
  country?: string;
  price?: number;
  currency?: string;
  category?: string;
  image_url?: string;
  poster_image_url?: string;
  is_featured: boolean;
  organizer_name?: string;
};

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Event[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'profile' | 'settings'>('favorites');
  const [error, setError] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);

  // Redirect if not logged in or if admin (admins should use admin dashboard)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    } else if (!loading && user && user.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async (): Promise<void> => {
    try {
      setError(null);
      const response = await fetch('/api/events/favorite');
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setError('Failed to load your favorite events. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleFavorite = async (eventId: string): Promise<void> => {
    try {
      setFavoriteLoading(eventId);
      setError(null);
      
      const response = await fetch('/api/events/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle favorite: ${response.status}`);
      }

      // Refresh favorites to get updated list
      await fetchFavorites();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setError('Failed to update favorites. Please try again.');
    } finally {
      setFavoriteLoading(null);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">Manage your events and track your activity</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'favorites', label: 'Favorites', icon: Heart },
                { key: 'profile', label: 'Profile', icon: Settings },
                { key: 'settings', label: 'Settings', icon: Bell }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'favorites' | 'profile' | 'settings')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.key
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'favorites' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Favorite Events</h2>
                  <Link
                    href="/events"
                    className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
                  >
                    <ExternalLink size={16} />
                    Browse More Events
                  </Link>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                    <button 
                      onClick={() => {
                        setError(null);
                        fetchFavorites();
                      }}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {favorites.length === 0 && !error ? (
                  <div className="text-center py-12">
                    <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                    <p className="text-gray-500 mb-4">
                      Start exploring events and add them to your favorites
                    </p>
                    <Link
                      href="/events"
                      className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center"
                    >
                      <Calendar size={16} className="mr-2" />
                      Browse Events
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((event: Event) => (
                      <div key={event.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative">
                          <div className="h-48 bg-gradient-to-br from-teal-400 to-cyan-500">
                            {event.poster_image_url ? (
                              <Image
                                src={event.poster_image_url || "/chillfy-logo.png"}
                                alt={event.title}
                                width={400}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="h-12 w-12 text-white" />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(event.id)}
                            disabled={favoriteLoading === event.id}
                            className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all disabled:opacity-50"
                          >
                            {favoriteLoading === event.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />
                            ) : (
                              <Heart size={16} className="text-red-500" fill="currentColor" />
                            )}
                          </button>
                          {event.is_featured && (
                            <div className="absolute top-3 left-3 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              <Star size={12} className="mr-1" fill="currentColor" />
                              Featured
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 text-lg mb-2">{event.title}</h3>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar size={14} className="mr-2" />
                              {new Date(event.date).toLocaleDateString()}
                              {event.time && (
                                <span className="ml-2">
                                  {new Date(`2000-01-01T${event.time}`).toLocaleTimeString([], { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                            
                            {event.organizer_name && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Users size={14} className="mr-2" />
                                Organized by {event.organizer_name}
                              </div>
                            )}

                            {event.venue && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin size={14} className="mr-2" />
                                {event.venue}
                                {(event.location || event.country) && <span>, {event.location || event.country}</span>}
                              </div>
                            )}
                            
                            {event.price !== undefined && event.price > 0 && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Ticket size={14} className="mr-2" />
                                {event.currency || 'USD'} {event.price}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs">
                              {event.category}
                            </span>
                            <Link
                              href={`/events/${event.id}`}
                              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                      <p className="text-gray-900">N/A</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
                  <p className="text-gray-600">Settings panel coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
