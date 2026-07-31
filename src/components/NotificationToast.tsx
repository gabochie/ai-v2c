import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { NotificationService, InAppNotificationEvent } from '../utils/notificationService';
import { Task } from '../types';

interface NotificationToastProps {
  onSelectTask?: (task: Task) => void;
  darkMode: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  onSelectTask,
  darkMode,
}) => {
  const [notifications, setNotifications] = useState<InAppNotificationEvent[]>([]);
  const [permissionState, setPermissionState] = useState<string>(NotificationService.getPermissionState());

  useEffect(() => {
    const handleNotificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent<InAppNotificationEvent>;
      if (customEvent.detail) {
        setNotifications((prev) => [customEvent.detail, ...prev.slice(0, 4)]);
      }
    };

    window.addEventListener('app-task-notification', handleNotificationEvent);
    return () => {
      window.removeEventListener('app-task-notification', handleNotificationEvent);
    };
  }, []);

  const handleRequestPermission = async () => {
    const result = await NotificationService.requestPermission();
    setPermissionState(result);
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-3">
      {/* Permission Banner Prompt if Default */}
      {permissionState === 'default' && (
        <div className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900/95 border-orange-500/30 text-white' : 'bg-white/95 border-orange-500/30 text-slate-900'
        } backdrop-blur-md`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold">Enable Desktop Task Alerts</p>
              <p className="text-[10px] text-slate-400">Receive alerts for Critical tasks and 24h due dates</p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs whitespace-nowrap shadow-sm"
          >
            Enable Alerts
          </button>
        </div>
      )}

      {/* Active Toast Alerts List */}
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl transition-all animate-in slide-in-from-top-2 duration-300 ${
            notif.type === 'critical'
              ? 'bg-red-950/90 border-red-500/50 text-red-100'
              : 'bg-amber-950/90 border-amber-500/50 text-amber-100'
          } backdrop-blur-md`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${
                notif.type === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {notif.type === 'critical' ? (
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                ) : (
                  <Clock className="w-5 h-5 animate-pulse" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    notif.type === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {notif.type === 'critical' ? 'Critical Trigger' : 'Due < 24 Hours'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{notif.timestamp}</span>
                </div>

                <h4 className="font-extrabold text-xs mt-1 leading-tight">{notif.title}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>

                {onSelectTask && (
                  <button
                    onClick={() => {
                      onSelectTask(notif.task);
                      handleDismiss(notif.id);
                    }}
                    className="mt-2 text-[10px] font-mono font-bold underline text-orange-400 hover:text-orange-300"
                  >
                    View Task Details →
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDismiss(notif.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
