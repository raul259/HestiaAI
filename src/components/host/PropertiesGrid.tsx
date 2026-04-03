"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Building2, Plus, ExternalLink, Wrench, AlertCircle, Search, Clock } from "lucide-react";

const INACTIVE_DAYS = 15;

interface PropertyRow {
  id: string;
  name: string;
  address: string;
  status: string | null;
  createdAt: Date | string;
  conversations: { createdAt: Date | string }[];
  _count: { appliances: number; incidents: number };
}

function isInactive(property: PropertyRow): boolean {
  const now = Date.now();
  const created = new Date(property.createdAt).getTime();
  if (now - created < INACTIVE_DAYS * 24 * 60 * 60 * 1000) return false;
  if (property.conversations.length === 0) return true;
  const lastConv = new Date(property.conversations[0].createdAt).getTime();
  return now - lastConv > INACTIVE_DAYS * 24 * 60 * 60 * 1000;
}

interface Props {
  properties: PropertyRow[];
  openByProperty: Record<string, number>;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "occupied", label: "Con huésped" },
  { value: "inactive", label: "Inactivas" },
];

export default function PropertiesGrid({ properties, openByProperty }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        const matchesSearch =
          search === "" ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.address.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || (p.status ?? "active") === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [properties, search, statusFilter]
  );

  if (properties.length === 0) {
    return (
      <div className="card text-center py-20">
        <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h2 className="font-outfit font-semibold text-xl text-deep-forest mb-2">
          Aún no tienes propiedades
        </h2>
        <p className="font-inter text-sm text-gray-400 mb-6">
          Añade tu primera propiedad para empezar a usar Hestia-AI.
        </p>
        <Link href="/host/properties/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Añadir propiedad
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Buscador + filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o dirección..."
            className="input-field pl-10 text-sm py-2.5"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`text-xs font-inter px-3 py-2 rounded-xl border transition-colors ${
                statusFilter === opt.value
                  ? "bg-deep-forest text-white border-deep-forest"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-inter text-sm text-gray-400">
            No hay propiedades que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((property) => {
            const openCount = openByProperty[property.id] ?? 0;
            const inactive = isInactive(property);
            return (
              <div
                key={property.id}
                className="card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-deep-forest/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-deep-forest" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {openCount > 0 && (
                        <span className="badge text-xs text-orange-600 bg-orange-50 border-orange-200">
                          {openCount} abierta{openCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {inactive && (
                        <span className="badge text-xs text-amber-700 bg-amber-50 border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sin actividad +{INACTIVE_DAYS}d
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="font-outfit font-semibold text-deep-forest text-lg mb-1">
                    {property.name}
                  </h2>
                  <p className="font-inter text-sm text-gray-400 mb-4 line-clamp-2">
                    {property.address}
                  </p>

                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-sm font-inter text-gray-500">
                      <Wrench className="w-3.5 h-3.5" />
                      {property._count.appliances} electrod.
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-inter text-gray-500">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {property._count.incidents} incid.
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/host/properties/${property.id}`}
                    className="flex-1 text-center text-sm font-inter font-medium text-deep-forest border border-deep-forest/20 rounded-xl py-2 hover:bg-deep-forest hover:text-white transition-colors"
                  >
                    Gestionar
                  </Link>
                  <Link
                    href={`/guest/${property.id}`}
                    target="_blank"
                    className="flex items-center gap-1.5 text-sm font-inter text-electric-mint border border-electric-mint/30 rounded-xl px-3 py-2 hover:bg-electric-mint/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Huésped
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
