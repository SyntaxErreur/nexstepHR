import { Outlet } from 'react-router-dom';
import { Topbar } from './topbar';
import { Sidebar } from './sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <Sidebar />
      <main className="pl-60 pt-16 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}

export function ResponderLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 border-b bg-white flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          <span className="font-bold text-lg">NexStep HR</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Secure Session
          </span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto py-8 px-4">
        <Outlet />
      </main>
    </div>
  );
}
