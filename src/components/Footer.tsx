export default function Footer() {
  return (
    <footer className="bg-gray-100 text-center py-4 mt-8 border-t">
      <span className="text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Chillfy. All rights reserved.
      </span>
    </footer>
  );
}