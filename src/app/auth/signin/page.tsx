/* eslint react/no-unescaped-entities: 0 */
"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChillfyLogo } from "@/components/ChillfyLogo";
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface SignInFormData {
  email: string;
  password: string;
}

function SignInContent() {
  const [formData, setFormData] = useState<SignInFormData>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, adoptSession } = useAuth();

  const supabase = getSupabaseClient();

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null); // Clear error when user types
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 [SignIn] Attempting sign-in...');
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      console.log('✅ [SignIn] Sign-in successful');

      // Set session cookies for server-side authentication
      if (data.session?.access_token && data.session?.refresh_token) {
        try {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest' // Additional CSRF protection
            },
            credentials: 'include',
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          });
        } catch (sessionError) {
          console.warn('Could not set session cookies:', sessionError);
          // Don't fail the login if session cookies can't be set
        }
      }

      // Redirect to dashboard or intended page
      const redirectTo = searchParams.get('redirectTo') || '/dashboard';
      router.push(redirectTo);

    } catch (err: any) {
      console.error('❌ [SignIn] Sign-in failed:', err);
      
      // Enhanced error handling with specific user-friendly messages
      let errorMessage = 'An error occurred during sign-in';
      
      if (err.message?.includes('Invalid login credentials') || 
          err.message?.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password';
      } else if (err.message?.includes('Too many requests') || 
                 err.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait and try again';
      } else if (err.message?.includes('Email not confirmed') || 
                 err.message?.includes('verify your email')) {
        errorMessage = 'Please check your email and confirm your account first';
      } else if (err.message?.includes('Network') || 
                 err.message?.includes('fetch')) {
        errorMessage = 'Connection error. Please check your internet and try again';
      } else if (err.message?.includes('disabled') || 
                 err.message?.includes('banned')) {
        errorMessage = 'This account has been disabled. Please contact support';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  if (user) {
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    router.push(redirectTo);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <ChillfyLogo className="mx-auto mb-4" size="lg" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
