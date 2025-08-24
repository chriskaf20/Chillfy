"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
};

export default function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as keyof typeof errorMessages;
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-8">{message}</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
