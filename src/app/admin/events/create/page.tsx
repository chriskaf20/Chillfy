"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, MapPin, Users, DollarSign, Image as ImageIcon, Tag, Link as LinkIcon } from "lucide-react";
import { SUPPORTED_CURRENCIES, POPULAR_CURRENCIES, CURRENCY_INFO, formatPrice } from "@/utils/currencyUtils";
import type { CurrencyCode } from "@/types/event";

interface EventFormData {
  title: string;
  description: string;
  image_url: string;
  location: string;
  country: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  end_times: string;
  price: string;
  currency: CurrencyCode;
  category: string;
  tags: string[];
  max_attendees: string;
  ticket_link: string;
  map_link: string;
  dress_code: string;
  menu: string;
  organizer_name: string;
  is_published: boolean;
}

const CATEGORIES = [
  'Music & Concerts',
  'Food & Drink', 
  'Arts & Culture',
  'Sports & Fitness',
  'Business & Networking',
  'Entertainment',
  'Education & Learning',
  'Community & Social',
  'Technology',
  'Health & Wellness'
];

export default function AdminCreateEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<EventFormData>({
    title: "",
    description: "",
    image_url: "",
    location: "",
    country: "",
    venue: "",
    address: "",
    date: "",
    time: "",
    end_times: "",
    price: "",
    currency: "USD",
    category: "",
    tags: [],
    max_attendees: "",
    ticket_link: "",
    map_link: "",
    dress_code: "",
    menu: "",
    organizer_name: "",
    is_published: false,
  });

  const [tagInput, setTagInput] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Don't render for non-admins
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((errs) => ({ ...errs, [name]: "" }));
  };

  const onToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((f) => ({ ...f, [name]: checked }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.date) errs.date = "Date is required";
    if (!form.category) errs.category = "Category is required";
    
    if (form.end_times && form.time && form.end_times <= form.time) {
      errs.end_times = "End time must be after start time";
    }
    
    if (form.price) {
      const price = Number(form.price);
      if (isNaN(price) || price < 0) {
        errs.price = "Price must be a valid number >= 0";
      }
    }
    
    if (form.max_attendees) {
      const capacity = Number(form.max_attendees);
      if (isNaN(capacity) || capacity <= 0) {
        errs.max_attendees = "Capacity must be a positive number";
      }
    }
    
    if (form.image_url && !form.image_url.match(/^https?:\/\/.+/)) {
      errs.image_url = "Image URL must be a valid HTTP/HTTPS URL";
    }
    
    if (form.ticket_link && !form.ticket_link.match(/^https?:\/\/.+/)) {
      errs.ticket_link = "Ticket link must be a valid HTTP/HTTPS URL";
    }
    
    if (form.map_link && !form.map_link.match(/^https?:\/\/.+/)) {
      errs.map_link = "Map link must be a valid HTTP/HTTPS URL";
    }
    
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccess(false);
    
    try {
      const errs = validate();
      if (Object.keys(errs).length) {
        setFieldErrors(errs);
        return;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim() || null,
        location: form.location.trim() || null,
        country: form.country.trim() || null,
        venue: form.venue.trim() || null,
        address: form.address.trim() || null,
        date: form.date,
        time: form.time || null,
        end_times: form.end_times || null,
        price: form.price ? Number(form.price) : null,
        currency: form.currency,
        category: form.category,
        tags: form.tags.length > 0 ? form.tags : null,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
        ticket_link: form.ticket_link.trim() || null,
        map_link: form.map_link.trim() || null,
        dress_code: form.dress_code.trim() || null,
        menu: form.menu.trim() || null,
        is_published: form.is_published,
        organizer_name: form.organizer_name?.trim() || user.name || 'Admin',
      };

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      const data = await res.json();
      setSuccess(true);
      
      // Redirect to the created event after a short delay
      setTimeout(() => {
        router.push(`/events/${data.event.id}`);
      }, 2000);

    } catch (err) {
      console.error("Create event error:", err);
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-green-800 mb-2">Event Created Successfully!</h1>
          <p className="text-green-700">Redirecting you to the event page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
        <p className="text-gray-600">Fill in the details to create a new event</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ImageIcon size={20} className="text-teal-500" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter event title"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your event..."
              />
              {fieldErrors.description && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {fieldErrors.category && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Image URL
              </label>
              <input
                name="image_url"
                value={form.image_url}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.image_url ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/image.jpg"
              />
              {fieldErrors.image_url && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.image_url}</p>
              )}
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-teal-500" />
            Date & Time
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.date && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                name="time"
                type="time"
                value={form.time}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.time && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                name="end_times"
                type="time"
                value={form.end_times}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.end_times ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.end_times && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.end_times}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <MapPin size={20} className="text-teal-500" />
            Location
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name
              </label>
              <input
                name="venue"
                value={form.venue}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., Conference Center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                name="country"
                value={form.country}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., Turkey"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Complete address with street, district, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Description
              </label>
              <input
                name="location"
                value={form.location}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., Near metro station"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Map Link
              </label>
              <input
                name="map_link"
                value={form.map_link}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.map_link ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://maps.google.com/..."
              />
              {fieldErrors.map_link && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.map_link}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Capacity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-teal-500" />
            Pricing & Capacity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {fieldErrors.price && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <optgroup label="Popular Currencies">
                  {POPULAR_CURRENCIES.map(curr => (
                    <option key={curr} value={curr}>
                      {curr} - {CURRENCY_INFO[curr].name} ({CURRENCY_INFO[curr].symbol})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Currencies">
                  {SUPPORTED_CURRENCIES.filter(curr => !POPULAR_CURRENCIES.includes(curr)).map(curr => (
                    <option key={curr} value={curr}>
                      {curr} - {CURRENCY_INFO[curr].name} ({CURRENCY_INFO[curr].symbol})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attendees
              </label>
              <input
                name="max_attendees"
                type="number"
                min="1"
                value={form.max_attendees}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.max_attendees ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100"
              />
              {fieldErrors.max_attendees && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.max_attendees}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Tag size={20} className="text-teal-500" />
            Tags
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter a tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Add Tag
              </button>
            </div>
            
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-teal-600 hover:text-teal-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <LinkIcon size={20} className="text-teal-500" />
            Additional Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Link
              </label>
              <input
                name="ticket_link"
                value={form.ticket_link}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  fieldErrors.ticket_link ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://tickets.example.com"
              />
              {fieldErrors.ticket_link && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.ticket_link}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organizer Name
              </label>
              <input
                name="organizer_name"
                value={form.organizer_name}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Event organizer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dress Code
              </label>
              <input
                name="dress_code"
                value={form.dress_code}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., Smart casual"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu/Food Information
              </label>
              <textarea
                name="menu"
                value={form.menu}
                onChange={onChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Describe food, drinks, or catering information..."
              />
            </div>
          </div>
        </div>

        {/* Publish Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Publish Settings</h2>
          
          <div className="flex items-center gap-3">
            <input
              id="is_published"
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={onToggle}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
              Publish event immediately
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            If unchecked, the event will be saved as a draft and can be published later.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
