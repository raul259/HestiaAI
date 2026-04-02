"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DataPoint {
  week: string;
  incidencias: number;
}

interface Props {
  data: DataPoint[];
}

export default function IncidentChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400 font-inter">
        Sin datos suficientes para mostrar la evolución
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fontFamily: "Inter, sans-serif", fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fontFamily: "Inter, sans-serif", fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(value) => [value ?? 0, "Incidencias"]}
        />
        <Line
          type="monotone"
          dataKey="incidencias"
          stroke="#88EBC0"
          strokeWidth={2.5}
          dot={{ fill: "#1B3022", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#1B3022" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
