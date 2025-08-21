"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChillfyLogo } from './ChillfyLogo';
import { useAuth } from '@/context/AuthContext';
import { 
  Menu, 
  X, 
  User, 
  Calendar, 
  Home, 
  HelpCircle, 
  Users,
  Settings,
  LogOut,
  Plus,
  Crown,
  Heart,
  Mail
} from 'lucide-react';

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, login, logout, isAdmin } = useAuth();
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/about', label: 'About', icon: HelpCircle },
    { href: '/contact', label: 'Contact', icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <ChillfyLogo size="md" showText />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive(href)
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
                }`}
              >
                <Icon size={16} />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth & User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors ${
                      isActive('/admin')
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                    }`}
                  >
                    <Crown size={16} />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
                
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors ${
                    isActive('/dashboard') && !isActive('/admin')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <User size={16} />
                  <span className="font-medium">Dashboard</span>
                </Link>

                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium max-w-24 truncate">{user.name}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                          <Crown size={12} className="mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Profile Settings</span>
                    </Link>
                    
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Heart size={16} />
                      <span>My Events</span>
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-2 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-xl text-gray-600 hover:text-teal-600 hover:bg-gray-50 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="px-2 pt-4 pb-6 space-y-2 bg-white/95 backdrop-blur-sm">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive(href)
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
              
              {user ? (
                <>
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="px-4 py-2 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center space-x-3 px-4 py-3 text-yellow-700 bg-yellow-50 rounded-xl transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Crown size={20} />
                      <span className="font-medium">Admin Dashboard</span>
                    </Link>
                  )}
                  
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 text-blue-700 bg-blue-50 rounded-xl transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User size={20} />
                    <span className="font-medium">My Dashboard</span>
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings size={20} />
                    <span className="font-medium">Profile Settings</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    login();
                    setIsOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 font-medium mt-4"
                >
                  Sign In to Chillfy
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}