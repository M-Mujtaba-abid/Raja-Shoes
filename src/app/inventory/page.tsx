"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  dateAdded: string;
  articleName: string;
  size: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  status: "IN_STOCK" | "OUT_OF_STOCK";
  notes?: string;
};

const emptyForm = {
  articleName: "", size: "", quantity: "", costPrice: "", salePrice: "",
  dateAdded: new Date().toISOString().split("T")[0], notes: "",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function fetchProducts() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); });
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  function openAdd() {
    setForm({ ...emptyForm, dateAdded: new Date().toISOString().split("T")[0] });
    setEditId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      articleName: p.articleName, size: p.size, quantity: String(p.quantity),
      costPrice: String(p.costPrice), salePrice: String(p.salePrice),
      dateAdded: p.dateAdded.split("T")[0], notes: p.notes || "",
    });
    setEditId(p.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/products/${editId}` : "/api/products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
      } else {
        setShowForm(false);
        fetchProducts();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  }

  const margin = (p: Product) => {
    const cost = parseFloat(String(p.costPrice));
    const sale = parseFloat(String(p.salePrice));
    if (!cost || !sale) return 0;
    return Math.round(((sale - cost) / sale) * 100);
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Inventory</h1>
          <p className="text-dark-400 text-sm mt-0.5">Manage all shoe stock</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search by article, size..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select w-40"
        >
          <option value="">All Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
        <span className="text-dark-500 text-sm">{products.length} items</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50">
              <tr>
                {["Date Added", "Article Name", "Size", "Qty", "Cost Price", "Sale Price", "Margin", "Status", "Actions"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="table-cell text-center text-dark-500 py-12">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center text-dark-500 py-12">No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="table-row hover:bg-dark-800/30 transition-colors">
                  <td className="table-cell text-dark-400 text-xs">{new Date(p.dateAdded).toLocaleDateString("en-PK")}</td>
                  <td className="table-cell font-medium text-white">{p.articleName}</td>
                  <td className="table-cell text-dark-300">{p.size}</td>
                  <td className="table-cell">
                    <span className={p.quantity <= 5 ? "text-yellow-400 font-medium" : "text-dark-200"}>{p.quantity}</span>
                  </td>
                  <td className="table-cell text-dark-300">{formatCurrency(p.costPrice)}</td>
                  <td className="table-cell text-dark-200 font-medium">{formatCurrency(p.salePrice)}</td>
                  <td className="table-cell">
                    <span className="text-emerald-400 text-xs font-medium">{margin(p)}%</span>
                  </td>
                  <td className="table-cell">
                    <span className={p.status === "IN_STOCK" ? "badge-green" : "badge-red"}>
                      {p.status === "IN_STOCK" ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-dark-400 hover:text-brand-400 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(p.id, p.articleName)} className="text-dark-400 hover:text-red-400 transition-colors">
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
          <div className="card w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editId ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowForm(false)} className="text-dark-500 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Article Name *</label>
                  <input required className="input" placeholder="e.g. Nike Air Max 270" value={form.articleName} onChange={(e) => setForm({ ...form, articleName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Size *</label>
                  <input required className="input" placeholder="e.g. 42, UK8" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
                </div>
                <div>
                  <label className="label">Quantity *</label>
                  <input required type="number" min="0" className="input" placeholder="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="label">Cost Price (PKR) *</label>
                  <input required type="number" min="0" step="0.01" className="input" placeholder="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                </div>
                <div>
                  <label className="label">Sale Price (PKR) *</label>
                  <input required type="number" min="0" step="0.01" className="input" placeholder="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
                </div>
                <div>
                  <label className="label">Date Added</label>
                  <input type="date" className="input" value={form.dateAdded} onChange={(e) => setForm({ ...form, dateAdded: e.target.value })} />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input className="input" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving..." : editId ? "Update Product" : "Add Product"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
