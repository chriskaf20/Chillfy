"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  Eye, 
  EyeOff, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Star 
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  price?: number;
  currency?: string;
  category?: string;
  image_url?: string;
  is_featured: boolean;
  is_published: boolean;
  attendee_count?: number;
  capacity?: number;
}

interface DashboardStats {
  total_events: number;
  published_events: number;
  total_attendees: number;
  upcoming_events: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<string>('');

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/stats')
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTogglePublish = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/${eventId}/toggle-publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentStatus }),
      });

      if (response.ok) {
        setEvents((prev: Event[]) => prev.map((event: Event) => 
          event.id === eventId 
            ? { ...event, is_published: !currentStatus }
            : event
        ));
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const handleToggleFeatured = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/${eventId}/toggle-featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentStatus }),
      });

      if (response.ok) {
        setEvents((prev: Event[]) => prev.map((event: Event) => 
          event.id === eventId 
            ? { ...event, is_featured: !currentStatus }
            : event
        ));
      }
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(eventId);
    try {
      const response = await fetch(`/api/admin/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents((prev: Event[]) => prev.filter((event: Event) => event.id !== eventId));
        setSelectedEvents((prev: string[]) => prev.filter((id: string) => id !== eventId));
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setIsDeleting('');
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedEvents.length === 0) return;

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedEvents.length} event(s)? This cannot be undone.`
      : `Are you sure you want to ${action} ${selectedEvents.length} event(s)?`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/admin/events/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: selectedEvents, action }),
      });

      if (response.ok) {
        if (action === 'delete') {
          setEvents((prev: Event[]) => prev.filter((event: Event) => !selectedEvents.includes(event.id)));
        } else {
          setEvents((prev: Event[]) => prev.map((event: Event) => 
            selectedEvents.includes(event.id)
              ? { ...event, is_published: action === 'publish' }
              : event
          ));
        }
        setSelectedEvents([]);
        fetchDashboardData(); // Refresh stats
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const filteredEvents = events.filter((event: Event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'published' && event.is_published) ||
                         (filterStatus === 'draft' && !event.is_published);
    
    return matchesSearch && matchesFilter;
  });

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage events and monitor platform activity</p>
            </div>
            <Link
              href="/admin/events/create"
              className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors inline-flex items-center mt-4 sm:mt-0"
            >
              <Plus size={20} className="mr-2" />
              Create Event
            </Link>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_events}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Published</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.published_events}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Attendees</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_attendees}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcoming_events}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Events Management */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Event Management</h2>
              
              {/* Bulk Actions */}
              {selectedEvents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedEvents.length} selected</span>
                  <button
                    onClick={() => handleBulkAction('publish')}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm hover:bg-green-200 transition-colors"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => handleBulkAction('unpublish')}
                    className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                  >
                    Unpublish
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Events</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents(filteredEvents.map((event: Event) => event.id));
                        } else {
                          setSelectedEvents([]);
                        }
                      }}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event: Event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents((prev: string[]) => [...prev, event.id]);
                          } else {
                            setSelectedEvents((prev: string[]) => prev.filter((id: string) => id !== event.id));
                          }
                        }}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-200 mr-4">
                          {event.image_url ? (
                            <Image
                              src={event.image_url}
                              alt={event.title}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            {event.is_featured && (
                              <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{event.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(event.date).toLocaleDateString()}
                      {event.time && (
                        <div className="text-xs text-gray-500">
                          {new Date(`2000-01-01T${event.time}`).toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.is_published ? 'Published' : 'Draft'}
                        </span>
                        {event.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <span className="font-medium">{event.attendee_count || 0}</span>
                        {event.capacity && (
                          <span className="text-gray-500">/{event.capacity}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="text-teal-600 hover:text-teal-700 p-1"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(event.id, event.is_published)}
                          className={`p-1 ${event.is_published ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                          title={event.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {event.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(event.id, event.is_featured)}
                          className={`p-1 ${event.is_featured ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                          title={event.is_featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star size={16} fill={event.is_featured ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={isDeleting === event.id}
                          className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
                        >
                          {isDeleting === event.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterStatus !== 'all' 
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first event"
                }
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Link
                  href="/admin/events/create"
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Create Event
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
