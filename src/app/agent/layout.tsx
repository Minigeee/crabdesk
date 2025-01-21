import { ReactNode } from "react";
import Link from "next/link";

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-sm">
        <nav className="flex h-full flex-col">
          <div className="p-4">
            <h1 className="text-xl font-bold">AutoCRM</h1>
          </div>
          
          <div className="flex-1 space-y-1 p-2">
            <Link 
              href="/agent"
              className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            
            <Link 
              href="/agent/tickets"
              className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Tickets
            </Link>
            
            <Link 
              href="/agent/knowledge"
              className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Knowledge Base
            </Link>
            
            <Link 
              href="/agent/analytics"
              className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Analytics
            </Link>
            
            <Link 
              href="/agent/team"
              className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Team
            </Link>
          </div>
          
          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium">Agent Name</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 