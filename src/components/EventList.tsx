"use client";
import React from "react";
import useEvents from "@/hooks/useEvents";
import EventCard from "./EventCard";

export default function EventList() {
  const { events, loading, error } = useEvents();

  if (loading) return <div>Loading events...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      {events.length === 0 ? (
        <div>No events found.</div>
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            title={event.title}
            date={event.date}
            description={event.description}
          />
        ))
      )}
    </div>
  );
}