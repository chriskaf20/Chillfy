"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Calendar, 
  Eye, 
  EyeOff,
  Star,
  TrendingUp,
  BarChart3,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Crown
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
  category?: string;
  image_url?: string;
  is_featured: boolean;
  is_published: boolean;
  capacity?: number;
  tickets_available?: number;
  attendee_count?: number;
  created_at: string;
};

type DashboardStats = {
  total_events: number;
  published_events: number;
  total_attendees: number;
  upcoming_events: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'users'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, eventsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/events'),
        fetch('/api/admin/users')
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleEventVisibility = async (eventId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/admin/${eventId}/toggle-publish`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, is_published: !isPublished }
            : event
        ));
      }
    } catch (error) {
      console.error('Failed to toggle event visibility:', error);
    }
  };

  const toggleEventFeatured = async (eventId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/${eventId}/toggle-featured`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, is_featured: !isFeatured }
            : event
        ));
      }
    } catch (error) {
      console.error('Failed to toggle event featured status:', error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/admin/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter(event => event.id !== eventId));
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="h-8 w-8 text-yellow-500" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage events, users, and monitor platform activity</p>
            </div>
            <Link
              href="/admin/events/create"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'events', label: 'Events', icon: Calendar },
              { key: 'users', label: 'Users', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.key
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_events}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.published_events}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_attendees}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcoming_events}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Events</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {event.image_url && (
                          <Image
                            src={event.image_url}
                            alt={event.title}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {event.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          event.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Events</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {event.image_url && (
                              <Image
                                src={event.image_url}
                                alt={event.title}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover mr-4"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{event.title}</div>
                              <div className="text-sm text-gray-500">{event.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(event.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              event.is_published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {event.is_published ? 'Published' : 'Draft'}
                            </span>
                            {event.is_featured && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/admin/events/edit/${event.id}`}
                              className="text-teal-600 hover:text-teal-900"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => toggleEventVisibility(event.id, event.is_published)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {event.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => toggleEventFeatured(event.id, event.is_featured)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-teal-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-teal-600 hover:text-teal-900">
                              <Settings className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <UserX className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
