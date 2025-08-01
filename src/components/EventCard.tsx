import React from "react";

type EventCardProps = {
  title: string;
  date: string;
  description: string;
};

export default function EventCard({ title, date, description }: EventCardProps) {
  return (
    <div className="p-4 rounded shadow bg-white mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-gray-500">{date}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}