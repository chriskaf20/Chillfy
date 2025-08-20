import React from 'react';
import Link from 'next/link';
import { ChillfyLogo } from './ChillfyLogo';
import { Mail, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <ChillfyLogo size="lg" showText />
            <p className="mt-4 text-gray-300 max-w-md">
              Discover amazing events happening around North Cyprus. From concerts and festivals 
              to workshops and community gatherings - find your next adventure with Chillfy.
            </p>
            <div className="flex items-center mt-4 text-gray-300">
              <MapPin size={16} className="mr-2" />
              <span>North Cyprus</span>
            </div>
            <div className="flex items-center mt-2 text-gray-300">
              <Mail size={16} className="mr-2" />
              <a href="mailto:info@chillfy.com" className="hover:text-teal-400 transition-colors">
                info@chillfy.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-gray-300 hover:text-teal-400 transition-colors">
                  All Events
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-300 hover:text-teal-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-teal-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-teal-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-teal-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-teal-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-gray-300 hover:text-teal-400 transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            © {currentYear} Chillfy. All rights reserved.
          </p>
          <p className="text-gray-300 text-sm flex items-center mt-2 md:mt-0">
            Made with <Heart size={16} className="mx-1 text-red-400" /> for North Cyprus
          </p>
        </div>
      </div>
    </footer>
  );
}