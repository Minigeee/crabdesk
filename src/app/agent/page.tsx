export default function AgentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Placeholder for quick actions */}
          <button className="rounded-lg bg-primary px-4 py-2 text-white">
            New Ticket
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Pending Replies</h3>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">SLA Breaches</h3>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Resolved Today</h3>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Queue */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">My Queue</h2>
          <div className="rounded border">
            <div className="p-4 text-center text-sm text-gray-500">
              No tickets assigned
            </div>
          </div>
        </div>

        {/* Team Activity */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Team Activity</h2>
          <div className="rounded border">
            <div className="p-4 text-center text-sm text-gray-500">
              No recent activity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 