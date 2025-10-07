"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { favoriteApi } from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";

interface FavoriteButtonProps {
  eventId: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({ 
  eventId, 
  className = "", 
  showText = true,
  size = "md" 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuth();

  // Size variants
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm", 
    lg: "px-6 py-3 text-base"
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  // Check initial favorite status
  useEffect(() => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await favoriteApi.checkFavoriteStatus(eventId);
        setIsFavorite(response.isFavorite || false);
      } catch (error) {
        console.error("Failed to check favorite status:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    checkStatus();
  }, [eventId, user]);

  const handleToggle = async () => {
    if (!user) {
      // You could trigger a login modal here
      alert("Please sign in to add favorites");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const response = await favoriteApi.toggleFavorite(eventId);
      setIsFavorite(response.action === "added");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Optionally show error toast
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <button 
        disabled 
        className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-400 transition-colors ${sizeClasses[size]} ${className}`}
      >
        <Heart size={iconSizes[size]} />
        {showText && "Loading..."}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg border transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorite
          ? "border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600"
          : "border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-500"
      } ${sizeClasses[size]} ${className}`}
    >
      <Heart 
        size={iconSizes[size]} 
        className={`transition-all ${isFavorite ? "fill-white" : "fill-transparent"} ${loading ? "animate-pulse" : ""}`} 
      />
      {showText && (
        <span>{loading ? "..." : isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
      )}
    </button>
  );
}
