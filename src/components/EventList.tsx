"use client";
import React from 'react';
import useEvents from '@/hooks/useEvents';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  venue?: string;
  price?: string | number | null;
  category?: string;
  image_url?: string;
  created_at?: string;
};

export default function EventList() {
  const { events, loading, error } = useEvents();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Events</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
        <p className="text-gray-500 mb-6">
          No events are currently scheduled. Check back soon for exciting happenings in North Cyprus!
        </p>
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-sm text-gray-600 mb-3">Want to add your event?</p>
          <a 
            href="mailto:info@chillfy.com?subject=Add Event to Chillfy"
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors inline-block"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return null;
    const priceStr = String(price).toLowerCase();
    if (priceStr === '0' || priceStr === 'free') return 'Free';
    return `${price}₺`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Upcoming Events ({events.length})
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: Event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {event.image_url && (
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {event.title}
                </h3>
                {event.category && (
                  <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                    {event.category}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2 text-gray-400" />
                  <span>{formatDate(event.date)}</span>
                </div>
                
                {event.time && (
                  <div className="flex items-center">
                    <Clock size={14} className="mr-2 text-gray-400" />
                    <span>{event.time}</span>
                  </div>
                )}
                
                {(event.location || event.venue) && (
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-2 text-gray-400" />
                    <span>{event.venue || event.location}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {event.description}
              </p>

              <div className="flex justify-between items-center">
                {event.price && (
                  <span className="text-lg font-bold text-teal-600">
                    {formatPrice(event.price)}
                  </span>
                )}
                
                <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}