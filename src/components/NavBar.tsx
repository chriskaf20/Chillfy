import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex items-center gap-8">
        <Link href="/" className="font-bold text-teal-600 text-lg">
          Chillfy
        </Link>
        <div className="flex gap-4">
          <Link href="/events" className="hover:underline">Events</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
      </div>
    </nav>
  );
}