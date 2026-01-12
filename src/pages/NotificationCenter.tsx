import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Bell, Trophy, Star, Flame, Check, Trash2, 
  Gift, Ticket, BookOpen, AlertCircle, Filter
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  read: boolean;
  data: unknown;
  created_at: string;
  user_id: string;
}

type FilterType = "all" | "unread" | "raffle" | "badge" | "reward";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('read', true);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_earned':
        return <Trophy className="w-6 h-6 text-warning" />;
      case 'reward_received':
        return <Star className="w-6 h-6 text-primary" />;
      case 'streak_warning':
        return <Flame className="w-6 h-6 text-streak" />;
      case 'new_assignment':
        return <BookOpen className="w-6 h-6 text-blue-500" />;
      case 'raffle_win':
        return <Ticket className="w-6 h-6 text-success" />;
      case 'raffle_entry':
        return <Gift className="w-6 h-6 text-accent" />;
      case 'points_deducted':
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Bell className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'badge_earned':
        return 'bg-warning/10 border-warning/30';
      case 'reward_received':
        return 'bg-primary/10 border-primary/30';
      case 'streak_warning':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'new_assignment':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'raffle_win':
        return 'bg-success/10 border-success/30';
      case 'raffle_entry':
        return 'bg-accent/10 border-accent/30';
      case 'points_deducted':
        return 'bg-destructive/10 border-destructive/30';
      default:
        return 'bg-muted border-border';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "raffle") return n.type.includes("raffle");
    if (filter === "badge") return n.type === "badge_earned";
    if (filter === "reward") return n.type === "reward_received";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let group: string;
    if (date.toDateString() === today.toDateString()) {
      group = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = "Yesterday";
    } else if (date > new Date(today.setDate(today.getDate() - 7))) {
      group = "This Week";
    } else {
      group = "Earlier";
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/student">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="font-bold text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mb-6">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="raffle" className="text-xs">🎟️ Raffle</TabsTrigger>
            <TabsTrigger value="badge" className="text-xs">🏆 Badges</TabsTrigger>
            <TabsTrigger value="reward" className="text-xs">⭐ Rewards</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
            </h2>
            <p className="text-muted-foreground">
              {filter === "all" 
                ? "Complete assignments to earn rewards and get notified!" 
                : "Check back later for updates"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                  {group}
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((notification, idx) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative rounded-xl border p-4 ${getNotificationColor(notification.type)} ${
                          !notification.read ? 'ring-2 ring-primary/20' : ''
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="flex-shrink-0 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.created_at)}
                              </span>
                              {!notification.read && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear Read Button */}
        {notifications.some(n => n.read) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <Button variant="outline" size="sm" onClick={clearAllRead}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear read notifications
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
