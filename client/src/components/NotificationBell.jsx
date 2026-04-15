import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Inbox, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-all group"
      >
        <motion.div
           animate={unreadCount > 0 ? {
             rotate: [0, -10, 10, -10, 10, 0],
           } : {}}
           transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 5 }}
        >
           <Bell size={22} className="group-hover:scale-110 transition-transform" />
        </motion.div>
        
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0f0f0f] shadow-glow-sm"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-hover/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                แจ้งเตือน
                {unreadCount > 0 && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">{unreadCount} ใหม่</span>}
              </h3>
              {notifications.length > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={14} /> อ่านทั้งหมด
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm">กำลังโหลด...</div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Inbox size={40} className="mx-auto text-gray-600 mb-2 opacity-20" />
                  <p className="text-gray-500 text-sm font-medium">ไม่มีการแจ้งเตือนในขณะนี้</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => { 
                        if (!notif.is_read) markAsRead(notif.id); 
                        if (notif.link) { 
                          setIsOpen(false);
                          navigate(notif.link);
                        } 
                      }}
                      className={`p-4 flex gap-3 transition-colors cursor-pointer group hover:bg-white/5 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="text-xl shrink-0">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-bold truncate ${!notif.is_read ? 'text-white' : 'text-gray-400'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-gray-600 whitespace-nowrap mt-1">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${!notif.is_read ? 'text-gray-300' : 'text-gray-500'}`}>
                          {notif.message}
                        </p>
                        {notif.link && (
                          <div className="mt-2 text-[10px] text-primary font-bold flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            คลิกเพื่อดูรายละเอียด <ExternalLink size={10} />
                          </div>
                        )}
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 shadow-glow-sm" />
                       )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-border bg-surface-hover/20 text-center">
               <span className="text-[10px] text-gray-600">แสดงผล 20 รายการล่าสุด</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
