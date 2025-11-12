export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Genki TCG Admin
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Tournament management platform for One Piece TCG
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Events</h2>
              <p className="text-gray-600">
                Create and manage tournaments
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Players</h2>
              <p className="text-gray-600">
                Manage player registrations and check-ins
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Pairings</h2>
              <p className="text-gray-600">
                Generate Swiss pairings and manage rounds
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Credits</h2>
              <p className="text-gray-600">
                Manage player credits and transactions
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Setup Required:</strong> Configure your database and
              authentication in the .env file to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
