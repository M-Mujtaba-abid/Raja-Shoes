"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type Stats = {
  totalSales: number;
  totalInvoices: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingKhataCount: number;
  pendingKhataAmount: number;
};

const DATE_FILTERS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("month");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?dateFilter=${dateFilter}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, [dateFilter]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Overview of your business performance</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-dark-900 border border-dark-800 rounded-lg p-1">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                dateFilter === f.value
                  ? "bg-brand-500 text-white"
                  : "text-dark-400 hover:text-dark-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-dark-800" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Sales"
              value={formatCurrency(stats.totalSales)}
              icon="💰"
              sub={`${stats.totalInvoices} invoices`}
              color="blue"
            />
            <StatCard
              label="Gross Profit"
              value={formatCurrency(stats.grossProfit)}
              icon="📈"
              sub="From sales"
              color="green"
            />
            <StatCard
              label="Total Expenses"
              value={formatCurrency(stats.totalExpenses)}
              icon="📤"
              sub="Costs & withdrawals"
              color="red"
            />
            <StatCard
              label="Net Profit"
              value={formatCurrency(stats.netProfit)}
              icon={stats.netProfit >= 0 ? "✅" : "⚠️"}
              sub="Profit after expenses"
              color={stats.netProfit >= 0 ? "brand" : "red"}
              highlight
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Products in Stock"
              value={String(stats.totalProducts)}
              icon="👟"
              sub={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : "Stock healthy"}
              color={stats.lowStockProducts > 0 ? "yellow" : "green"}
            />
            <StatCard
              label="Khata Outstanding"
              value={formatCurrency(stats.pendingKhataAmount)}
              icon="📒"
              sub={`${stats.pendingKhataCount} pending accounts`}
              color="yellow"
            />
            <div className="card flex flex-col gap-3">
              <p className="text-xs font-medium text-dark-400 uppercase tracking-wide">Quick Actions</p>
              <div className="space-y-2">
                <Link href="/pos" className="btn-primary w-full flex items-center gap-2 justify-center">
                  <span>🧾</span> New Invoice
                </Link>
                <Link href="/inventory" className="btn-secondary w-full flex items-center gap-2 justify-center">
                  <span>➕</span> Add Product
                </Link>
              </div>
            </div>
          </div>

          {/* Net Profit Breakdown */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Net Profit Breakdown</h3>
            <div className="space-y-3">
              <BreakdownRow label="Gross Profit from Sales" value={stats.grossProfit} positive />
              <BreakdownRow label="Total Expenses" value={stats.totalExpenses} positive={false} />
              <div className="border-t border-dark-700 pt-3">
                <BreakdownRow
                  label="Net Profit"
                  value={stats.netProfit}
                  positive={stats.netProfit >= 0}
                  bold
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label, value, icon, sub, color, highlight,
}: {
  label: string; value: string; icon: string; sub: string;
  color: "green" | "red" | "blue" | "yellow" | "brand"; highlight?: boolean;
}) {
  const borderColors = {
    green: "border-l-emerald-500",
    red: "border-l-red-500",
    blue: "border-l-blue-500",
    yellow: "border-l-yellow-500",
    brand: "border-l-brand-500",
  };

  return (
    <div className={`card border-l-2 ${borderColors[color]} ${highlight ? "ring-1 ring-brand-500/20" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-dark-400 uppercase tracking-wide">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xl font-display font-bold text-white">{value}</p>
      <p className="text-xs text-dark-500 mt-1">{sub}</p>
    </div>
  );
}

function BreakdownRow({
  label, value, positive, bold,
}: {
  label: string; value: number; positive: boolean; bold?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={`text-sm ${bold ? "text-white" : "text-dark-300"}`}>{label}</span>
      <span className={`text-sm font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
        {positive ? "+" : "-"}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
