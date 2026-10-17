"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Dashboard, Period, Subscriptions } from "@/lib/types";
import { Select } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { EmptyState } from "./shared";
import { money } from "@/lib/utils";
export const periodOptions = [
  { value: "year", label: "Monthly" },
  { value: "month", label: "This month" },
  { value: "week", label: "This week" },
];
export function ChartHeader({
  title,
  period,
  onPeriod,
  children,
}: {
  title: string;
  period: Period;
  onPeriod: (v: Period) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="chart-header">
      <h2>{title}</h2>
      <div className="chart-controls">
        {children}
        <Select
          label={`${title} period`}
          value={period}
          onValueChange={(v) => onPeriod(v as Period)}
          options={periodOptions}
        />
      </div>
    </div>
  );
}
function growthData(data: Dashboard["userGrowth"], period: Period) {
  const now = new Date();
  if (period === "year")
    return Array.from({ length: 12 }, (_, i) => {
      const rows = data.filter(
        (row) => row._id.month === i + 1 && row._id.year === now.getFullYear(),
      );
      return {
        name: new Date(2026, i).toLocaleString("en", { month: "short" }),
        free: rows.reduce((sum, row) => sum + (row.free || 0), 0),
        premium: rows.reduce((sum, row) => sum + (row.premium || 0), 0),
      };
    });
  const count = period === "week" ? 7 : now.getDate();
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (count - i - 1));
    const rows = data.filter(
      (row) =>
        row._id.day === day.getDate() && row._id.month === day.getMonth() + 1,
    );
    return {
      name: day.toLocaleString("en", { month: "short", day: "numeric" }),
      free: rows.reduce((sum, row) => sum + (row.free || 0), 0),
      premium: rows.reduce((sum, row) => sum + (row.premium || 0), 0),
    };
  });
}
export function GrowthChart({
  data,
  period,
  loading,
}: {
  data?: Dashboard["userGrowth"];
  period: Period;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="chart-skeleton" />;
  if (!data?.length)
    return (
      <div className="growth-chart">
        <EmptyState
          message="No user activity yet"
          hint="User registrations will appear here."
        />
      </div>
    );
  return (
    <div className="growth-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={growthData(data, period)}
          barGap={3}
          margin={{ top: 24, right: 28, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#d7dbea" />
          <XAxis
            dataKey="name"
            axisLine={{ stroke: "#777" }}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#656571" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fontSize: 13, fill: "#8993c1" }}
            width={48}
          />
          <Tooltip cursor={{ fill: "#f5f3ff" }} />
          <Legend
            verticalAlign="bottom"
            height={58}
            iconType="square"
            iconSize={20}
            formatter={(value) => (
              <span className="chart-legend">
                {value === "free" ? "Free User" : "Premium User"}
              </span>
            )}
          />
          <Bar
            dataKey="free"
            fill="#8b75ff"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="premium"
            fill="#ff8c86"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function EarningsChart({
  data,
  currency = "USD",
  loading,
}: {
  data?: Subscriptions["revenue"];
  currency?: string;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="chart-skeleton earnings-skeleton" />;
  const selected = data?.filter((item) => item._id.currency === currency) || [];
  if (!selected.length)
    return (
      <div className="earnings-chart">
        <EmptyState
          message="No earnings in this period"
          hint="Completed subscription payments will appear here."
        />
      </div>
    );
  const chart = Array.from({ length: 12 }, (_, i) => ({
    name: new Date(2026, i).toLocaleString("en", { month: "short" }),
    amount: selected
      .filter((row) => row._id.month === i + 1)
      .reduce((sum, row) => sum + row.amountMinor / 100, 0),
  }));
  return (
    <div className="earnings-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chart}
          margin={{ top: 20, right: 38, bottom: 14, left: 4 }}
        >
          <CartesianGrid vertical={false} stroke="#d7dbea" />
          <XAxis
            dataKey="name"
            tickLine={false}
            tick={{ fontSize: 12, fill: "#656571" }}
            axisLine={{ stroke: "#777" }}
          />
          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#656571" }}
            tickFormatter={(value) =>
              money(Number(value), currency).replace(/\.00$/, "")
            }
          />
          <Tooltip formatter={(value) => money(Number(value), currency)} />
          <Area
            type="linear"
            dataKey="amount"
            name="Earnings"
            stroke="#8b75ff"
            strokeWidth={5}
            fill="#8b75ff"
            fillOpacity={0.09}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
