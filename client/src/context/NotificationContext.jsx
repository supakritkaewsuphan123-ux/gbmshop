import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Play a professional notification sound
  const playSound = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.4;
      audio.play();
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }, []);

  const processedEventIds = useRef(new Set());

  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (!user) return;
    try {
      if (isInitial) setLoading(true);
      
      const { data: newNotifs, error: notifsError } = await supabase
        .from('notifications')
        .select('id, title, message, type, link, is_read, event_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notifsError) throw notifsError;

      // Update processed Set
      newNotifs?.forEach(n => processedEventIds.current.add(n.event_id));

      const { count: newCount, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (countError) throw countError;

      setNotifications(prev => {
        const prevUnreadCount = prev.filter(n => !n.is_read).length;
        if (!isInitial && (newCount || 0) > prevUnreadCount) {
          playSound();
        }
        return newNotifs || [];
      });
      
      setUnreadCount(newCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [user, playSound]);

  // Initial fetch and Realtime Subscription
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      processedEventIds.current.clear();
      return;
    }

    fetchNotifications(true);

    // ⚡ REAL-TIME: Listen for new notifications for this user
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        }, 
        (payload) => {
          const newNotif = payload.new;
          if (processedEventIds.current.has(newNotif.event_id)) {
            console.log('[NOTIF] Duplicate event ignored:', newNotif.event_id);
            return;
          }
          processedEventIds.current.add(newNotif.event_id);
          console.log('[NOTIF] New unique real-time message received:', newNotif);
          fetchNotifications(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  // Optimistic UI for marking as read
  const markAsRead = async (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      markAsRead, 
      markAllAsRead, 
      refresh: fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
