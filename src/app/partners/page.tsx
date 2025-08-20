export default function PartnersPage() {
  const partners = [
    {
      name: "North Cyprus Tourism Board",
      description: "Promoting tourism and events across North Cyprus",
      website: "#"
    },
    {
      name: "Local Event Organizers",
      description: "Community partners helping bring amazing events to life",
      website: "#"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Our Partners</h1>
      <p className="text-lg text-gray-600 text-center mb-12">
        We work with amazing partners to bring you the best events in North Cyprus
      </p>
      
      <div className="grid md:grid-cols-2 gap-8">
        {partners.map((partner, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">{partner.name}</h3>
            <p className="text-gray-600 mb-4">{partner.description}</p>
            <a 
              href={partner.website}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Learn More →
            </a>
          </div>
        ))}
      </div>
      
      <div className="mt-12 bg-teal-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Become a Partner</h2>
        <p className="text-gray-700 mb-6">
          Are you an event organizer, venue, or business interested in partnering with Chillfy?
        </p>
        <a 
          href="mailto:partnerships@chillfy.com"
          className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors inline-block"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
