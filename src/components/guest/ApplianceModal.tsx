"use client";

import dynamic from "next/dynamic";
import { X, MapPin, Tag } from "lucide-react";
import { Appliance } from "@/types";

const ApplianceViewer = dynamic(() => import("./ApplianceViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#f0f7f4]">
      <div className="w-8 h-8 border-2 border-electric-mint border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface Props {
  appliance: Appliance;
  onClose: () => void;
}

export default function ApplianceModal({ appliance, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "90vh", maxHeight: 640 }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="font-outfit font-bold text-deep-forest text-lg leading-tight truncate">
              {appliance.name}
            </h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-inter text-slate-body">
                <Tag className="w-3 h-3" />
                {appliance.category}
              </span>
              {appliance.location && (
                <span className="inline-flex items-center gap-1 text-xs font-inter text-slate-body">
                  <MapPin className="w-3 h-3" />
                  {appliance.location}
                </span>
              )}
              {appliance.model && (
                <span className="text-xs font-inter text-gray-400">
                  Modelo: {appliance.model}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Viewer 3D */}
        <div className="flex-1 overflow-hidden">
          <ApplianceViewer appliance={appliance} />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs font-inter text-slate-body text-center">
            Usa el <strong>chat</strong> para preguntar cómo usar este electrodoméstico
          </p>
        </div>
      </div>
    </div>
  );
}
