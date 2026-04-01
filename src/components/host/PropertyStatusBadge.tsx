"use client";

import { useState } from "react";

const STATUS_CONFIG = {
  active: { label: "Activa", dot: "bg-green-500", badge: "bg-green-100 text-green-800 border-green-200" },
  occupied: { label: "Con huésped", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800 border-blue-200" },
  inactive: { label: "Inactiva", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 border-gray-200" },
} as const;

type Status = keyof typeof STATUS_CONFIG;

interface Props {
  propertyId: string;
  initialStatus: string;
}

export default function PropertyStatusBadge({ propertyId, initialStatus }: Props) {
  const [status, setStatus] = useState<Status>(
    (initialStatus as Status) in STATUS_CONFIG ? (initialStatus as Status) : "active"
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newStatus: Status) => {
    setSaving(true);
    setOpen(false);
    await fetch("/api/properties", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: propertyId, status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
  };

  const cfg = STATUS_CONFIG[status];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-inter font-medium transition-colors ${cfg.badge} hover:opacity-80`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <span className="text-gray-400 ml-0.5">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-36">
          {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${s === status ? "font-semibold" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
