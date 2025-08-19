"use client";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError("Failed to send message.");
    } catch (err: any) {
      setError(err.message || "Error sending message.");
    }
  }

  if (sent)
    return (
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-4">Contact Chillfy</h2>
        <p>Your message has been sent. Thank you!</p>
      </div>
    );

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">Contact Chillfy</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label>Message</label>
          <textarea
            className="w-full border p-2 rounded"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            required
          />
        </div>
        <button className="px-4 py-2 bg-teal-600 text-white rounded" type="submit">
          Send
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
    </div>
  );
}