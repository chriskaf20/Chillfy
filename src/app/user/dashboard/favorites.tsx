/* eslint react/no-unescaped-entities: 0 */
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, 
  Heart, 
  MapPin, 
  Users,
  Ticket,
  Clock
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type FavoriteEvent = {
  id: string;
  title: string;
  organizer_name?: string;
  date: string;
  time?: string;
  venue?: string;
  location?: string;
  country?: string;
  price?: number;
  currency?: string;
  poster_image_url?: string;
  image_url?: string;
};

export default function FavoritesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch('/api/events/favorite');
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle empty array or null response safely
      const favoriteEvents = data.favorites || [];
      setFavorites(Array.isArray(favoriteEvents) ? favoriteEvents : []);
      
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setError('Failed to load your favorite events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while authenticating or fetching data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Your Favorite Events</h1>
          <p className="text-gray-600 mt-1">Events you&apos;ve saved for later</p>
        </div>

        {/* Error State */}
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

        {/* Empty State */}
        {!error && favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Heart size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite events yet</h3>
            <p className="text-gray-500 mb-6">
              Start exploring events and add them to your favorites
            </p>
            <Link
              href="/events"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Calendar size={16} className="mr-2" />
              Browse Events
            </Link>
          </div>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Poster */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                  {(event.poster_image_url || event.image_url) ? (
                    <Image
                      src={event.poster_image_url || event.image_url || "/default-poster.png"}
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
                
                {/* Event Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">{event.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    {/* Organizer Name */}
                    {event.organizer_name && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users size={14} className="mr-2 flex-shrink-0" />
                        <span>Organized by {event.organizer_name}</span>
                      </div>
                    )}
                    
                    {/* Date and Time */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={14} className="mr-2 flex-shrink-0" />
                      <span>
                        {new Date(event.date).toLocaleDateString()}
                        {event.time && (
                          <span className="ml-2">
                            at {new Date(`2000-01-01T${event.time}`).toLocaleTimeString([], { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* Location */}
                    {(event.venue || event.location || event.country) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={14} className="mr-2 flex-shrink-0" />
                        <span>
                          {event.venue}
                          {event.venue && (event.location || event.country) && ', '}
                          {event.location || event.country}
                        </span>
                      </div>
                    )}
                    
                    {/* Ticket Price */}
                    {event.price !== undefined && event.price !== null && event.price > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Ticket size={14} className="mr-2 flex-shrink-0" />
                        <span>{event.currency || 'USD'} {event.price}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* View Details Link */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Favorited</span>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
    </div>
  );
}
