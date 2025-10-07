"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Star, 
  ArrowRight,
  Play
} from "lucide-react";

export default function HeroSection() {
  const { user, login } = useAuth();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 mb-8 animate-fade-in">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="text-sm font-medium text-gray-700">
            Discover North Cyprus&apos;s Best Events
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
          <span className="text-gradient block mb-4">Experience</span>
          <span className="text-gray-900">Unforgettable Moments</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in">
          Find and attend the most exciting events, concerts, festivals, and gatherings 
          happening across North Cyprus. Your ultimate guide to entertainment and culture.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-12 animate-slide-up">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">500+</div>
            <div className="text-gray-600">Events Monthly</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">10K+</div>
            <div className="text-gray-600">Happy Attendees</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">50+</div>
            <div className="text-gray-600">Venues</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up">
          {user ? (
            <Link
              href="/events"
              className="btn-primary flex items-center gap-2 group"
            >
              Browse Events
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="btn-primary flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          
          <Link
            href="/about"
            className="btn-secondary flex items-center gap-2 group"
          >
            <Play className="h-5 w-5" />
            Learn More
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-slide-up">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Discovery</h3>
            <p className="text-gray-600 text-sm">
              Find events by category, date, or location with our intuitive search
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Local Focus</h3>
            <p className="text-gray-600 text-sm">
              Curated events specifically for the North Cyprus community
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Community Driven</h3>
            <p className="text-gray-600 text-sm">
              Join thousands of event enthusiasts and create memorable experiences
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-50/50 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-secondary-50/50 to-transparent pointer-events-none"></div>
    </section>
  );
}
