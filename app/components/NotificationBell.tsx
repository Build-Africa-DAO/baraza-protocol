"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useNotifications } from "../lib/NotificationContext";
import { EVENT_ICONS, timeAgo } from "../lib/notifications";

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const recent = notifications.slice(0, 5);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {recent.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? "bg-orange-50" : ""}`}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{EVENT_ICONS[n.eventType]}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100">
            <Link
              href="/inbox"
              onClick={() => setOpen(false)}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
