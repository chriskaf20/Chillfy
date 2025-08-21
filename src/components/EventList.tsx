"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import useEvents from "@/hooks/useEvents";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Filter,
  Search,
  Grid,
  List,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Event = {
  id: string;
  title?: string;
  description?: string;
  date: string;
  time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  venue?: string;
  city?: string;
  price?: number;
  currency?: string;
  category?: string;
  image_url?: string;
  is_featured?: boolean;
  capacity?: number;
  tickets_available?: number;
  organizer_name?: string;
  created_at?: string;
};

type ViewMode = "grid" | "list";
type SortBy = "date" | "popularity" | "price" | "newest";

export default function EventList() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingFavorite, setLoadingFavorite] = useState<string>("");

  const { events, loading, error } = useEvents();

  const categories = [
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
  ];

  const handleFavoriteToggle = async (eventId: string) => {
    if (!user) return;

    setLoadingFavorite(eventId);
    try {
      const response = await fetch("/api/events/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action: favorites.includes(eventId) ? "remove" : "add",
        }),
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
  };

  const filteredEvents = events.filter((event) => {
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

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "price":
        return (a.price || 0) - (b.price || 0);
      case "newest":
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    let formatted = date.toLocaleDateString("en-US", options);
    if (timeString) {
      const time = new Date(`2000-01-01T${timeString}`);
      formatted += ` at ${time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }
    return formatted;
  };

  const formatPrice = (price?: number, currency = "TRY") => {
    if (!price || price === 0) return "Free";
    return `${price.toFixed(0)} ${currency}`;
  };

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Discover Events ({sortedEvents.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "text-teal-600" : ""}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "text-teal-600" : ""}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <p>No events found</p>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              user={user}
              viewMode={viewMode}
              isFavorite={favorites.includes(event.id)}
              onFavoriteToggle={handleFavoriteToggle}
              loadingFavorite={loadingFavorite === event.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  user,
  viewMode,
  isFavorite,
  onFavoriteToggle,
  loadingFavorite,
}: {
  event: Event;
  user: any;
  viewMode: ViewMode;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
  loadingFavorite: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-bold">{event.title || "Untitled Event"}</h3>
      <p className="text-gray-600 text-sm">
        {event.description || "No description available"}
      </p>
      <Link
        href={`/events/${event.id}`}
        className="text-teal-600 hover:underline"
      >
        View Details
      </Link>
    </div>
  );
}
