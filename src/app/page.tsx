import HeroSection from '@/components/HeroSection';
import EventList from '@/components/EventList';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Events Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Events
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the most exciting events happening in North Cyprus right now
            </p>
          </div>
          
          <EventList />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Explore More?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of event enthusiasts and never miss out on the best experiences 
            North Cyprus has to offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">
              Browse All Events
            </button>
            <button className="btn-secondary">
              Learn About Chillfy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
