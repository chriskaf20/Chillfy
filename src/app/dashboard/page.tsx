"use client";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
        <p>You must be logged in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
      <p>Welcome, {user.name}!</p>
      <p>Here you can manage your events and account.</p>
    </div>
  );
}