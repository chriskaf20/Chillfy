import { ChillfyLogo } from '@/components/ChillfyLogo';
import EventList from '@/components/EventList';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <ChillfyLogo size="xl" showText />
      <h1 className="mt-8 text-4xl font-bold text-center">
        Welcome to Chillfy!
      </h1>
      <p className="mt-4 text-lg text-gray-600 text-center max-w-xl">
        Discover events happening around North Cyprus with Chillfy.
      </p>
      <section className="mt-8 w-full max-w-3xl">
        <EventList />
      </section>
    </div>
  );
}