import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth';
import { apiNotifications } from '@/api/mock';
import type { Notification } from '@/types';
import { Bell, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      apiNotifications.list(user.id).then(n => { setNotifications(n); setLoading(false); });
    }
  }, [user]);

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${notifications.filter(n => !n.read).length} unread`}
        breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Notifications' }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => {
            if (user) { apiNotifications.markAllRead(user.id); setNotifications(n => n.map(x => ({ ...x, read: true }))); }
          }}>
            <Check className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        }
      />
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-8 w-8 text-muted-foreground" />} title="No Notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={cn('cursor-pointer hover:shadow-sm transition-shadow', !n.read && 'border-primary/30 bg-primary/5')}
              onClick={() => { apiNotifications.markRead(n.id); setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); if (n.link) navigate(n.link); }}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', n.read ? 'bg-transparent' : 'bg-primary')} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
