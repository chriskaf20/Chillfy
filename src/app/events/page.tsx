import EventList from "@/components/EventList";

export default function EventsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">All Events</h2>
      <EventList />
    </div>
  );
}