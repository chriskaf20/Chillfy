"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChillfyLogo } from "@/components/ChillfyLogo";
import { Mail, Lock, ArrowRight, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

type AuthMethod = "email" | "password";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Failed to send sign-in email. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a sign-in link to <strong>{email}</strong>. 
              Click the link in the email to sign in to your account.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              Didn't receive the email? Check your spam folder or try signing in again.
            </div>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
              className="mt-6 text-teal-600 hover:text-teal-700 font-medium"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <ChillfyLogo size="xl" showText />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-600">
            Sign in to discover amazing events in North Cyprus
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Auth Method Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod("email")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                authMethod === "email"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-600 hover:text-teal-600"
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("password")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                authMethod === "password"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-600 hover:text-teal-600"
              }`}
            >
              Password
            </button>
          </div>

          <form onSubmit={authMethod === "email" ? handleEmailSubmit : handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
            </div>

            {authMethod === "password" && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || (authMethod === "password" && !password)}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-cyan-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {authMethod === "email" ? "Send Sign In Link" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {authMethod === "email" ? (
                <>
                  New to Chillfy? No problem! Just enter your email above and we'll create your account.
                  <br />
                  Prefer to use a password?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMethod("password")}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Sign in with password
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-teal-600 hover:text-teal-700 font-medium">
                    Create one here
                  </Link>
                  <br />
                  Forgot your password?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMethod("email")}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Use magic link instead
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>By signing in, you agree to our</p>
              <div className="space-x-1">
                <Link href="/terms" className="text-teal-600 hover:text-teal-700">Terms of Service</Link>
                <span>and</span>
                <Link href="/privacy" className="text-teal-600 hover:text-teal-700">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
