"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Expense = {
  id: string; amount: number; category: string;
  date: string; notes?: string; createdAt: string;
};

const CATEGORIES = [
  { value: "SALARY", label: "Salary" },
  { value: "TAYA_JEE", label: "Taya Jee" },
  { value: "MUNEEB", label: "Muneeb" },
  { value: "CZN", label: "Czn" },
  { value: "OTHER", label: "Other" },
];

const DATE_FILTERS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const emptyForm = {
  amount: "", category: "OTHER", date: new Date().toISOString().split("T")[0], notes: "",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("month");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function fetchExpenses() {
    const params = new URLSearchParams({ dateFilter });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    fetch(`/api/expenses?${params}`)
      .then((r) => r.json())
      .then((data) => { setExpenses(data); setLoading(false); });
  }

  useEffect(() => { fetchExpenses(); }, [search, categoryFilter, dateFilter]); // eslint-disable-line

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editId ? `/api/expenses/${editId}` : "/api/expenses";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditId(null);
        fetchExpenses();
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchExpenses();
  }

  function openEdit(e: Expense) {
    setForm({ amount: String(e.amount), category: e.category, date: e.date.split("T")[0], notes: e.notes || "" });
    setEditId(e.id);
    setShowForm(true);
  }

  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);

  // Group by category
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.value).reduce((s, e) => s + parseFloat(String(e.amount)), 0),
  })).filter((c) => c.total > 0);

  const categoryLabel = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Expenses</h1>
          <p className="text-dark-400 text-sm mt-0.5">Track all business costs and withdrawals</p>
        </div>
        <div className="flex items-center gap-2">
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
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card border-l-2 border-l-red-500">
          <p className="label">Total Expenses</p>
          <p className="text-xl font-display font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-dark-500 mt-1">{expenses.length} entries</p>
        </div>
        {byCategory.slice(0, 3).map((c) => (
          <div key={c.value} className="card border-l-2 border-l-dark-600">
            <p className="label">{c.label}</p>
            <p className="text-xl font-display font-bold text-white">{formatCurrency(c.total)}</p>
            <p className="text-xs text-dark-500 mt-1">{Math.round((c.total / totalExpenses) * 100)}% of total</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Search by notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50">
              <tr>
                {["Date", "Category", "Amount", "Notes", "Actions"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="table-cell text-center text-dark-500 py-12">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center text-dark-500 py-12">No expenses found</td></tr>
              ) : expenses.map((exp) => (
                <tr key={exp.id} className="table-row hover:bg-dark-800/30 transition-colors">
                  <td className="table-cell text-dark-300 text-xs">{new Date(exp.date).toLocaleDateString("en-PK")}</td>
                  <td className="table-cell">
                    <span className="badge-yellow">{categoryLabel(exp.category)}</span>
                  </td>
                  <td className="table-cell font-semibold text-red-400">{formatCurrency(exp.amount)}</td>
                  <td className="table-cell text-dark-400 text-xs">{exp.notes || "—"}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(exp)} className="text-dark-400 hover:text-brand-400 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="text-dark-400 hover:text-red-400 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editId ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={() => setShowForm(false)} className="text-dark-500 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Amount (PKR) *</label>
                <input required type="number" min="1" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Category *</label>
                <select required className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Description" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : editId ? "Update" : "Add Expense"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
