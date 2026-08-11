"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function MovementChart({ data }: { data: { date: string; in: number; out: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#E4E0D6" }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #E4E0D6", fontSize: 12 }}
            cursor={{ fill: "rgba(31,58,95,0.05)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="in" name="Stock In" fill="#2F7D4F" radius={[3, 3, 0, 0]} />
          <Bar dataKey="out" name="Stock Out" fill="#B4432E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
