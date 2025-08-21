"use client";
import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/context/AuthContext';
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
  Filter
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
  city?: string;
  price?: number;
  currency?: string;
  category?: string;
  image_url?: string;
  is_featured: boolean;
};

type UserActivity = {
  favorites: Event[];
  registered: Event[];
  attended: Event[];
};

export default function UserDashboard() {
  const { user, loading } = useRequireAuth();
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'registered' | 'attended'>('favorites');

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  const fetchUserActivity = async () => {
    try {
      const response = await fetch('/api/user/activity');
      if (response.ok) {
        const data = await response.json();
        setActivity(data);
      }
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    
    let formatted = date.toLocaleDateString('en-US', options);
    if (timeString) {
      const time = new Date(`2000-01-01T${timeString}`);
      formatted += ` • ${time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    return formatted;
  };

  const formatPrice = (price?: number, currency = 'TRY') => {
    if (!price || price === 0) return 'Free';
    return `${price.toFixed(0)} ${currency}`;
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

  const currentEvents = activity ? activity[activeTab] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 mt-1">Manage your events and discover new experiences</p>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <Link
                href="/profile"
                className="bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors inline-flex items-center"
              >
                <Settings size={16} className="mr-2" />
                Settings
              </Link>
              <Link
                href="/events"
                className="bg-teal-600 text-white px-6 py-2 rounded-xl hover:bg-teal-700 transition-colors inline-flex items-center"
              >
                <Calendar size={16} className="mr-2" />
                Browse Events
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {activity && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Favorite Events</p>
                    <p className="text-2xl font-bold text-gray-900">{activity.favorites.length}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-xl">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Registered Events</p>
                    <p className="text-2xl font-bold text-gray-900">{activity.registered.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Ticket className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Events Attended</p>
                    <p className="text-2xl font-bold text-gray-900">{activity.attended.length}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Events</h2>
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
              {[
                { key: 'favorites', label: 'Favorites', icon: Heart },
                { key: 'registered', label: 'Registered', icon: Ticket },
                { key: 'attended', label: 'Attended', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                    activeTab === key 
                      ? 'bg-white text-teal-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="p-6">
            {currentEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  {activeTab === 'favorites' && <Heart size={48} className="mx-auto text-gray-400" />}
                  {activeTab === 'registered' && <Ticket size={48} className="mx-auto text-gray-400" />}
                  {activeTab === 'attended' && <Star size={48} className="mx-auto text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} events yet
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === 'favorites' && "Start exploring events and add them to your favorites"}
                  {activeTab === 'registered' && "Register for events to see them here"}
                  {activeTab === 'attended' && "Your attended events will appear here"}
                </p>
                <Link
                  href="/events"
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center"
                >
                  <Calendar size={16} className="mr-2" />
                  Discover Events
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentEvents.map((event) => (
                  <div key={event.id} className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-32 overflow-hidden">
                      {event.image_url ? (
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                      )}
                      
                      {event.is_featured && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </div>
                      )}
                      
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white text-xs backdrop-blur-sm bg-black/30 rounded px-2 py-1">
                          <div className="flex items-center">
                            <Calendar size={12} className="mr-1" />
                            <span>{formatDate(event.date, event.time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                        {event.title}
                      </h3>
                      
                      {(event.venue || event.city) && (
                        <div className="flex items-center text-xs text-gray-600 mb-2">
                          <MapPin size={12} className="mr-1" />
                          <span className="line-clamp-1">
                            {event.venue}{event.venue && event.city ? ', ' : ''}{event.city}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-teal-600">
                          {formatPrice(event.price, event.currency)}
                        </span>
                        
                        <Link
                          href={`/events/${event.id}`}
                          className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-lg hover:bg-teal-200 transition-colors"
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

        {/* Recommendations */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended for You</h2>
          <p className="text-gray-600 mb-6">Based on your interests and activity</p>
          
          <div className="text-center py-8">
            <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Personalized recommendations coming soon!</p>
            <Link
              href="/events"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Browse all events →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}