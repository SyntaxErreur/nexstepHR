import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { apiNotifications } from '@/api/mock';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types';
import {
  Bell, LogOut, Search, User, ChevronDown, Shield, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Topbar() {
  const { user, impersonating, logout, stopImpersonating } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (user) {
      apiNotifications.list(user.id).then(setNotifications).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo */}
        <Link to={user ? (user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN' ? '/sa' : user.role === 'CONSULTANT' ? '/consultant' : '/app') : '/'} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          <span className="font-bold text-lg hidden sm:block">NexStep HR</span>
        </Link>

        {/* Impersonation Banner */}
        {impersonating && (
          <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
            <Shield className="h-3 w-3" />
            Impersonating {user?.name}
            <button onClick={stopImpersonating} className="hover:text-amber-900"><X className="h-3 w-3" /></button>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          {user && (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-background border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => { apiNotifications.markAllRead(user.id); setNotifications(n => n.map(x => ({ ...x, read: true }))); }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          className={cn('px-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50', !n.read && 'bg-primary/5')}
                          onClick={() => {
                            apiNotifications.markRead(n.id);
                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                            if (n.link) navigate(n.link);
                            setShowNotifs(false);
                          }}
                        >
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors"
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role.replace(/_/g, ' ')}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 bg-background border rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-md p-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Search companies, CAPs, users..."
              className="w-full h-10 pl-10 pr-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
