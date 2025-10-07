"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import useEvents from "@/hooks/useEvents";
import EnhancedEventCard from "./EnhancedEventCard";
import type { Event } from "@/types/event";
import {
  Filter,
  Search,
  Grid,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";

type ViewMode = "grid" | "list";
type SortBy = "date" | "price" | "newest" | "popularity";

export default function EventList() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingFavorite, setLoadingFavorite] = useState<string>("");

  const { events, loading, error } = useEvents();

  const categories = useMemo(() => [
    "All Categories",
    "Music & Concerts",
    "Food & Drink",
    "Arts & Culture",
    "Sports & Fitness",
    "Business & Networking",
    "Entertainment",
    "Education & Learning",
    "Community & Social",
    "Technology",
    "Health & Wellness",
  ], []);

  const handleFavoriteToggle = useCallback(async (eventId: string) => {
    if (!user) return;

    setLoadingFavorite(eventId);
    try {
      const response = await fetch("/api/events/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (response.ok) {
        setFavorites((prev) =>
          prev.includes(eventId)
            ? prev.filter((id) => id !== eventId)
            : [...prev, eventId]
        );
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setLoadingFavorite("");
    }
  }, [user]);

  // Memoized filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const title = event.title || "";
      const description = event.description || "";

      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "" ||
        selectedCategory === "All Categories" ||
        event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  // Memoized sorted events
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sortBy) {
        case "date":
          // Use date field for date sorting
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "newest":
          // For newest, we'll use the ID as a proxy since created_at isn't in the type
          // This is a simple fallback - in production you'd want to add created_at to the type
          return a.id.localeCompare(b.id);
        case "popularity":
          // For popularity, we'll use a simple fallback since attendee_count isn't in the type
          return 0;
        default:
          return 0;
      }
    });
  }, [filteredEvents, sortBy]);

  // Memoized callbacks for form handlers
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("");
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortBy);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gradient">Discover Events</h2>
            <p className="text-gray-600 mt-2">Loading amazing events...</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
          <div className="text-red-600 text-lg font-semibold mb-2">Oops!</div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Discover Events</h2>
          <p className="text-gray-600 mt-2">
            {sortedEvents.length} amazing events found
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-primary-600"
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === "list"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-primary-600"
              }`}
            >
              <List size={20} />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost flex items-center gap-2 ${
              showFilters ? "text-primary-600 bg-primary-50" : ""
            }`}
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 pr-4"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card-glass p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="btn-ghost p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="input-field"
                >
                  <option value="date">Date (Soonest)</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="newest">Newest First</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory || sortBy !== "date") && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSortBy("date");
                }}
                className="btn-ghost text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Events Grid */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-primary-100 to-primary-50 p-8 rounded-2xl">
              <Filter size={48} className="text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search criteria or filters"
                  : "No events are currently available. Check back later!"}
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                  }}
                  className="btn-primary"
                >
                  Clear Search & Filters
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-6"
          }
        >
          {sortedEvents.map((event) => (
            <EnhancedEventCard
              key={event.id}
              event={event}
              user={user}
              viewMode={viewMode}
              isFavorite={favorites.includes(event.id)}
              onFavoriteToggle={handleFavoriteToggle}
              loadingFavorite={loadingFavorite === event.id}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
