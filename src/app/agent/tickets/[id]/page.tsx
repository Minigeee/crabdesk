export default function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="grid h-full grid-cols-12 divide-x">
      {/* Left Panel - Ticket Details */}
      <div className="col-span-4 flex flex-col divide-y overflow-auto">
        <div className="p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Ticket #{params.id}</h2>
            <p className="text-sm text-gray-500">Created 2 hours ago</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2">
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Priority</label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Assigned To
              </label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2">
                <option>Unassigned</option>
                <option>Me</option>
                <option>Other Agents</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <h3 className="mb-2 font-medium">Customer Details</h3>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">No customer details available</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Conversation Thread */}
      <div className="col-span-8 flex h-full flex-col">
        <div className="flex-1 overflow-auto p-4">
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No messages in this conversation
          </div>
        </div>

        {/* Reply Box */}
        <div className="border-t p-4">
          <div className="rounded-lg border bg-white p-2">
            <div className="min-h-[100px] p-2">
              <textarea
                placeholder="Type your reply..."
                className="h-full w-full resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex items-center justify-between border-t p-2">
              <div className="flex items-center gap-2">
                <button className="rounded p-1 hover:bg-gray-100">
                  📎 {/* Attachment */}
                </button>
                <button className="rounded p-1 hover:bg-gray-100">
                  📝 {/* Template */}
                </button>
              </div>
              <button className="rounded-lg bg-primary px-4 py-2 text-white">
                Send Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 