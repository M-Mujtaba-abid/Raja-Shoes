"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Invoice = {
  id: string; invoiceNo: string; customerName: string;
  grandTotal: number; totalCost: number; grossProfit: number; createdAt: string;
  items: { articleName: string; quantity: number; salePrice: number; costPrice: number; itemProfit: number; size: string; subtotal: number }[];
};

const DATE_FILTERS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

export default function ProfitPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("month");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ dateFilter });
    if (search) params.set("search", search);
    fetch(`/api/invoices?${params}`)
      .then((r) => r.json())
      .then((data) => { setInvoices(data); setLoading(false); });
  }, [dateFilter, search]);

  const totalSales = invoices.reduce((s, i) => s + parseFloat(String(i.grandTotal)), 0);
  const totalCost = invoices.reduce((s, i) => s + parseFloat(String(i.totalCost)), 0);
  const totalProfit = invoices.reduce((s, i) => s + parseFloat(String(i.grossProfit)), 0);
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : "0";

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Profit Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Detailed profitability analysis per sale</p>
        </div>

        <div className="flex items-center gap-1.5 bg-dark-900 border border-dark-800 rounded-lg p-1">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                dateFilter === f.value ? "bg-brand-500 text-white" : "text-dark-400 hover:text-dark-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card border-l-2 border-l-blue-500">
          <p className="label">Total Revenue</p>
          <p className="text-xl font-display font-bold text-white">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-dark-500 mt-1">{invoices.length} invoices</p>
        </div>
        <div className="card border-l-2 border-l-red-500">
          <p className="label">Total Cost</p>
          <p className="text-xl font-display font-bold text-white">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-dark-500 mt-1">Purchase price</p>
        </div>
        <div className="card border-l-2 border-l-emerald-500">
          <p className="label">Gross Profit</p>
          <p className="text-xl font-display font-bold text-emerald-400">{formatCurrency(totalProfit)}</p>
          <p className="text-xs text-dark-500 mt-1">Revenue − Cost</p>
        </div>
        <div className="card border-l-2 border-l-brand-500">
          <p className="label">Profit Margin</p>
          <p className="text-xl font-display font-bold text-brand-400">{profitMargin}%</p>
          <p className="text-xs text-dark-500 mt-1">Average margin</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" placeholder="Search by customer, invoice..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
      </div>

      {/* Invoice Profit Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50">
              <tr>
                {["Invoice #", "Customer", "Revenue", "Cost", "Gross Profit", "Margin", "Date", ""].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-cell text-center text-dark-500 py-12">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="table-cell text-center text-dark-500 py-12">No invoices found</td></tr>
              ) : invoices.map((inv) => {
                const profit = parseFloat(String(inv.grossProfit));
                const revenue = parseFloat(String(inv.grandTotal));
                const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

                return (
                  <>
                    <tr key={inv.id} className="table-row hover:bg-dark-800/30 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                      <td className="table-cell font-mono text-xs text-brand-400">{inv.invoiceNo}</td>
                      <td className="table-cell text-white">{inv.customerName}</td>
                      <td className="table-cell text-dark-200">{formatCurrency(revenue)}</td>
                      <td className="table-cell text-dark-400">{formatCurrency(inv.totalCost)}</td>
                      <td className="table-cell font-medium text-emerald-400">{formatCurrency(profit)}</td>
                      <td className="table-cell">
                        <span className="badge-green">{margin}%</span>
                      </td>
                      <td className="table-cell text-dark-400 text-xs">{new Date(inv.createdAt).toLocaleDateString("en-PK")}</td>
                      <td className="table-cell">
                        <svg className={`w-4 h-4 text-dark-500 transition-transform ${expanded === inv.id ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </td>
                    </tr>
                    {expanded === inv.id && inv.items?.length > 0 && (
                      <tr key={`${inv.id}-exp`} className="bg-dark-800/20">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-2">Item Breakdown</p>
                            {inv.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4 text-xs bg-dark-800 rounded-lg px-3 py-2">
                                <span className="text-white flex-1">{item.articleName} (Size: {item.size})</span>
                                <span className="text-dark-400">Qty: {item.quantity}</span>
                                <span className="text-dark-400">@ {formatCurrency(item.salePrice)}</span>
                                <span className="text-dark-400">Cost: {formatCurrency(item.costPrice)}</span>
                                <span className="text-emerald-400 font-medium">Profit: {formatCurrency(item.itemProfit)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
