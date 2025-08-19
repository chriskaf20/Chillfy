"use client";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-4">Profile</h2>
        <p>You are not logged in.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">Profile</h2>
      <p><b>Name:</b> {user.name}</p>
      <p><b>Email:</b> {user.email}</p>
      <button className="mt-4 px-4 py-2 bg-teal-600 text-white rounded" onClick={logout}>
        Logout
      </button>
    </div>
  );
}