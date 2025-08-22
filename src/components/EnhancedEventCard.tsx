"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Ticket,
  Star,
} from "lucide-react";

// Use the same Event type as useEvents hook
export type Event = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  city?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  price?: number | null;
  category?: string | null;
  published?: boolean | null;
};

interface EnhancedEventCardProps {
  event: Event;
  user?: any;
  viewMode?: "grid" | "list";
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  loadingFavorite?: boolean;
  showActions?: boolean;
}

export default function EnhancedEventCard({
  event,
  user,
  viewMode = "grid",
  isFavorite = false,
  onFavoriteToggle,
  loadingFavorite = false,
  showActions = true,
}: EnhancedEventCardProps) {
  // Helper function to format date from start_at field
  const formatEventDate = (dateString?: string | null) => {
    if (!dateString) return "Date TBA";
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };

    return date.toLocaleDateString("en-US", options);
  };

  const formatPrice = (price?: number | null, currency = "TRY") => {
    if (!price || price === 0) return "Free";
    return `${price.toFixed(0)} ${currency}`;
  };

  const isUpcoming = event.start_at ? new Date(event.start_at) > new Date() : false;

  return (
    <div
      className={`card group overflow-hidden hover-lift ${
        viewMode === "list" ? "flex" : ""
      }`}
    >
      {/* Event Image */}
      <div
        className={`relative ${
          viewMode === "list"
            ? "w-48 h-48 flex-shrink-0"
            : "w-full h-48"
        }`}
      >
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-white opacity-80" />
          </div>
        )}
        
        {/* Status Badges */}
        <div className="absolute top-4 right-4 space-y-1">
          {!isUpcoming && (
            <div className="badge badge-secondary">Past Event</div>
          )}
        </div>
        
        {/* Favorite Button */}
        {showActions && user && onFavoriteToggle && (
          <button
            onClick={() => onFavoriteToggle(event.id)}
            disabled={loadingFavorite}
            className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors duration-200 group/fav"
          >
            {loadingFavorite ? (
              <div className="spinner" />
            ) : (
              <Heart
                size={20}
                className={
                  isFavorite
                    ? "text-red-500 fill-current"
                    : "text-gray-600 group-hover/fav:text-red-400"
                }
              />
            )}
          </button>
        )}
        
        {/* Image Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Event Content */}
      <div className="p-6 flex-1">
        {/* Category */}
        {event.category && (
          <div className="badge badge-primary mb-3">{event.category}</div>
        )}
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {event.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
          {event.description || "No description available"}
        </p>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-primary-600" />
            <span>{formatEventDate(event.start_at)}</span>
          </div>
          
          {/* Location */}
          {event.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-primary-600" />
              <span className="truncate">{event.city}</span>
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Ticket size={16} className="text-primary-600" />
            <span className="font-medium text-gray-900">
              {formatPrice(event.price)}
            </span>
          </div>
          
          {/* Placeholder for spacing */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} className="text-primary-600 opacity-0" />
            <span>&nbsp;</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Link
            href={`/events/${event.id}`}
            className="btn-primary text-sm px-4 py-2"
          >
            View Details
          </Link>
          
          {/* Quick Actions */}
          {showActions && user?.isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/events/${event.id}/edit`}
                className="btn-ghost text-sm"
              >
                Edit
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
