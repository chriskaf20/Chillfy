"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChillfyLogo } from './ChillfyLogo';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, User, Calendar, Home, HelpCircle, Users } from 'lucide-react';

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, login, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/partners', label: 'Partners', icon: Users },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <ChillfyLogo size="md" showText />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors duration-200"
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-teal-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors"
                >
                  <User size={16} />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-teal-600 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center space-x-2 text-gray-700 hover:text-teal-600 block px-3 py-2 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User size={16} />
                    <span>{user.name}</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    login();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}