"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Payment = { id: string; amount: number; date: string; notes?: string };
type KhataAccount = {
  id: string; customerName: string; phone?: string;
  totalBillAmount: number; totalPaid: number; remainingBalance: number;
  status: "PENDING" | "PARTIAL" | "CLEARED"; createdAt: string;
  payments: Payment[];
  invoice?: { invoiceNo: string; createdAt: string };
};

export default function KhataPage() {
  const [accounts, setAccounts] = useState<KhataAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<KhataAccount | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ customerName: "", phone: "", totalBillAmount: "", notes: "" });
  const [saving, setSaving] = useState(false);

  function fetchAccounts() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/khata?${params}`)
      .then((r) => r.json())
      .then((data) => { setAccounts(data); setLoading(false); });
  }

  useEffect(() => { fetchAccounts(); }, [search, statusFilter]); // eslint-disable-line

  async function handlePayment() {
    if (!selected || !payAmount) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/khata/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payAmount, date: payDate, notes: payNotes }),
      });
      if (res.ok) {
        setPayAmount("");
        setPayNotes("");
        fetchAccounts();
        // Refresh selected
        fetch(`/api/khata/${selected.id}`)
          .then((r) => r.json())
          .then(setSelected);
      }
    } finally { setPaying(false); }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/khata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewForm({ customerName: "", phone: "", totalBillAmount: "", notes: "" });
        fetchAccounts();
      }
    } finally { setSaving(false); }
  }

  const statusBadge = (s: string) =>
    s === "CLEARED" ? "badge-green" : s === "PARTIAL" ? "badge-yellow" : "badge-red";

  const totalOutstanding = accounts
    .filter((a) => a.status !== "CLEARED")
    .reduce((s, a) => s + parseFloat(String(a.remainingBalance)), 0);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Khata (Ledger)</h1>
          <p className="text-dark-400 text-sm mt-0.5">Credit customers and outstanding balances</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Khata
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border-l-2 border-l-red-500">
          <p className="label">Total Outstanding</p>
          <p className="text-xl font-display font-bold text-red-400">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="card border-l-2 border-l-yellow-500">
          <p className="label">Partial Payments</p>
          <p className="text-xl font-display font-bold text-yellow-400">{accounts.filter((a) => a.status === "PARTIAL").length}</p>
        </div>
        <div className="card border-l-2 border-l-emerald-500">
          <p className="label">Cleared Accounts</p>
          <p className="text-xl font-display font-bold text-emerald-400">{accounts.filter((a) => a.status === "CLEARED").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Search by name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select w-36">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="CLEARED">Cleared</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Accounts List */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800/50">
                <tr>
                  {["Customer", "Phone", "Bill Amount", "Paid", "Bakaya (Remaining)", "Status"].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="table-cell text-center text-dark-500 py-12">Loading...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan={6} className="table-cell text-center text-dark-500 py-12">No khata accounts found</td></tr>
                ) : accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className={`table-row cursor-pointer transition-colors ${selected?.id === acc.id ? "bg-brand-500/10" : "hover:bg-dark-800/30"}`}
                    onClick={() => setSelected(acc)}
                  >
                    <td className="table-cell font-medium text-white">{acc.customerName}</td>
                    <td className="table-cell text-dark-400 text-xs">{acc.phone || "—"}</td>
                    <td className="table-cell text-dark-200">{formatCurrency(acc.totalBillAmount)}</td>
                    <td className="table-cell text-emerald-400">{formatCurrency(acc.totalPaid)}</td>
                    <td className="table-cell font-semibold text-red-400">{formatCurrency(acc.remainingBalance)}</td>
                    <td className="table-cell"><span className={statusBadge(acc.status)}>{acc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger Detail */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{selected.customerName}</h3>
                  <span className={statusBadge(selected.status)}>{selected.status}</span>
                </div>
                {selected.invoice && (
                  <p className="text-xs text-dark-400">Invoice: <span className="text-brand-400">{selected.invoice.invoiceNo}</span></p>
                )}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-dark-400">Total Bill</span><span className="text-white font-medium">{formatCurrency(selected.totalBillAmount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-dark-400">Total Paid</span><span className="text-emerald-400 font-medium">{formatCurrency(selected.totalPaid)}</span></div>
                  <div className="border-t border-dark-700 pt-1.5 flex justify-between text-sm font-semibold"><span className="text-dark-200">Bakaya (Due)</span><span className="text-red-400">{formatCurrency(selected.remainingBalance)}</span></div>
                </div>

                {/* Payment form */}
                {selected.status !== "CLEARED" && (
                  <div className="space-y-2 pt-1 border-t border-dark-700">
                    <p className="text-xs font-medium text-dark-400 uppercase tracking-wide">Add Payment</p>
                    <input type="number" min="1" placeholder="Amount (PKR)" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input" />
                    <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="input" />
                    <input placeholder="Notes (optional)" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="input" />
                    <button onClick={handlePayment} disabled={paying || !payAmount} className="btn-primary w-full disabled:opacity-50">
                      {paying ? "Saving..." : "Record Payment"}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="card space-y-3">
                <h4 className="font-medium text-white text-sm">Payment History ({selected.payments?.length || 0})</h4>
                {!selected.payments?.length ? (
                  <p className="text-dark-500 text-xs">No payments recorded yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selected.payments.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs text-dark-400">{new Date(p.date).toLocaleDateString("en-PK")}</p>
                          {p.notes && <p className="text-xs text-dark-500">{p.notes}</p>}
                        </div>
                        <span className="text-sm font-medium text-emerald-400">+{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <p className="text-dark-500 text-sm">Select a customer to view ledger details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Khata Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">New Khata Account</h2>
              <button onClick={() => setShowAdd(false)} className="text-dark-500 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="label">Customer Name *</label>
                <input required className="input" value={newForm.customerName} onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="03xxxxxxxxx" value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Total Bill Amount *</label>
                <input required type="number" min="1" className="input" value={newForm.totalBillAmount} onChange={(e) => setNewForm({ ...newForm, totalBillAmount: e.target.value })} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Create Account"}</button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
