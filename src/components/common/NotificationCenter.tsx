import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sparkles, FileText, CheckCircle, ShieldAlert, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatRelativeTime } from '../../lib/utils';
import type { NotificationType } from '../../types/database';

export const NotificationCenter: React.FC<{ onNavigateToReport?: (reportId: string) => void }> = ({ onNavigateToReport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'match_found':
        return <Sparkles className="w-4 h-4 text-primary-600" />;
      case 'claim_submitted':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'claim_status':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-100 z-50 overflow-hidden animate-fadeIn">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">Campus Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="text-[11px] font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[11px] text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 hover:underline"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.related_report_id && onNavigateToReport) {
                      onNavigateToReport(notif.related_report_id);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                    !notif.read_at ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-white shadow-subtle border border-slate-100 h-fit">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
