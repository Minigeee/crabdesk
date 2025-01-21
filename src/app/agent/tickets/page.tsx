export default function TicketsPage() {
  return (
    <div className="h-full">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 border-b bg-gray-50 p-4 text-sm font-medium text-gray-500">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Subject</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Assigned To</div>
        <div className="col-span-1">Updated</div>
      </div>

      {/* Table Body */}
      <div className="h-[calc(100%-3.5rem)] overflow-auto">
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          No tickets found
        </div>
      </div>
    </div>
  );
} 