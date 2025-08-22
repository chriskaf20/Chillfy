import { CheckCircle } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            A sign in link has been sent to your email address. Click the link to sign in.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            Make sure to check your spam folder if you don't see the email.
          </div>
        </div>
      </div>
    </div>
  );
}