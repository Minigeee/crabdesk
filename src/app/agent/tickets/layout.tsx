import { ReactNode } from "react";

export default function TicketsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search tickets..."
              className="w-64 rounded-lg border bg-white px-4 py-2 pr-8 focus:outline-none focus:ring-2"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              {/* Search icon placeholder */}
              🔍
            </span>
          </div>
          <button className="rounded-lg bg-primary px-4 py-2 text-white">
            New Ticket
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <select className="rounded-lg border px-3 py-2">
          <option>All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
        
        <select className="rounded-lg border px-3 py-2">
          <option>All Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        
        <select className="rounded-lg border px-3 py-2">
          <option>Assigned to Me</option>
          <option>Unassigned</option>
          <option>All Agents</option>
        </select>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden rounded-lg bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
} 