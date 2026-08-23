"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function TrendChart({ data }: { data: { date: string; sales: number; profit: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(5)}
            fontSize={11}
            stroke="#94a3b8"
          />
          <YAxis fontSize={11} stroke="#94a3b8" />
          <Tooltip
            formatter={(value, name) => [
              `₹${Number(value ?? 0).toFixed(2)}`,
              name === "sales" ? "Sales" : "Profit",
            ]}
          />
          <Line type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
