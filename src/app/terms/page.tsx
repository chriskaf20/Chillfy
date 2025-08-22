export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Acceptance of Terms</h2>
        <p className="mb-4">
          By using Chillfy, you agree to be bound by these Terms of Service and our Privacy Policy.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Use of Service</h2>
        <p className="mb-4">
          Chillfy is a platform for discovering events in North Cyprus. You may use our service 
          to find and learn about local events.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">User Responsibilities</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Use the service lawfully and respectfully</li>
          <li>Provide accurate information when required</li>
          <li>Respect the rights of other users</li>
          <li>Follow event organizer guidelines</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact</h2>
        <p>
          Questions about these terms? Contact us at{' '}
          <a href="mailto:legal@chillfy.com" className="text-teal-600 hover:text-teal-700">
            legal@chillfy.com
          </a>
        </p>
      </div>
    </div>
  );
}
