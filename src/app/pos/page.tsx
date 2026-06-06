"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string; articleName: string; size: string;
  quantity: number; costPrice: number; salePrice: number;
};

type CartItem = {
  productId: string; articleName: string; size: string;
  quantity: number; salePrice: number; availableQty: number;
};

type Invoice = {
  id: string; invoiceNo: string; customerName: string;
  grandTotal: number; grossProfit: number; createdAt: string;
  items: { articleName: string; quantity: number; salePrice: number; size: string }[];
};

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [isKhata, setIsKhata] = useState(false);
  const [khataPhone, setKhataPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  // Invoices list
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invSearch, setInvSearch] = useState("");
  const [invDateFilter, setInvDateFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/products?status=IN_STOCK${search ? `&search=${search}` : ""}`)
      .then((r) => r.json()).then(setProducts);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (invSearch) params.set("search", invSearch);
    if (invDateFilter !== "all") params.set("dateFilter", invDateFilter);
    fetch(`/api/invoices?${params}`).then((r) => r.json()).then(setInvoices);
  }, [invSearch, invDateFilter]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        articleName: product.articleName,
        size: product.size,
        quantity: 1,
        salePrice: parseFloat(String(product.salePrice)),
        availableQty: product.quantity,
      }];
    });
  }

  function updateCartQty(productId: string, qty: number) {
    if (qty < 1) return removeFromCart(productId);
    const item = cart.find((i) => i.productId === productId);
    if (item && qty > item.availableQty) return;
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  }

  function updateCartPrice(productId: string, price: number) {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, salePrice: price } : i));
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const grandTotal = cart.reduce((s, i) => s + i.salePrice * i.quantity, 0);

  async function handleCheckout() {
    if (!customerName.trim()) return setError("Customer name is required");
    if (cart.length === 0) return setError("Add at least one item");
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, salePrice: i.salePrice })),
          isKhata,
          khataPhone,
          notes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to create invoice");
      } else {
        const invoice = await res.json();
        setLastInvoice(invoice);
        setCart([]);
        setCustomerName("");
        setIsKhata(false);
        setKhataPhone("");
        setNotes("");
        // Refresh invoices
        fetch("/api/invoices").then((r) => r.json()).then(setInvoices);
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">POS / Billing</h1>
        <p className="text-dark-400 text-sm mt-0.5">Create invoices and manage sales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Product Search + Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white text-sm">Add Products to Bill</h3>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search products by name or size..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {products.slice(0, 18).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="text-left bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg p-2.5 transition-all group"
                >
                  <p className="text-sm font-medium text-white group-hover:text-brand-400 truncate">{p.articleName}</p>
                  <p className="text-xs text-dark-400 mt-0.5">Size: {p.size} · Qty: {p.quantity}</p>
                  <p className="text-xs text-brand-400 font-medium mt-1">{formatCurrency(p.salePrice)}</p>
                </button>
              ))}
              {products.length === 0 && <p className="col-span-3 text-dark-500 text-sm py-4 text-center">No products found</p>}
            </div>
          </div>

          {/* Cart */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white text-sm">Bill Items ({cart.length})</h3>
            {cart.length === 0 ? (
              <p className="text-dark-500 text-sm py-4 text-center">No items added yet</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 bg-dark-800 rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.articleName}</p>
                      <p className="text-xs text-dark-400">Size: {item.size}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded bg-dark-700 text-white text-xs flex items-center justify-center hover:bg-dark-600">−</button>
                      <span className="text-sm w-6 text-center text-white">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded bg-dark-700 text-white text-xs flex items-center justify-center hover:bg-dark-600">+</button>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        value={item.salePrice}
                        onChange={(e) => updateCartPrice(item.productId, parseFloat(e.target.value) || 0)}
                        className="input text-xs text-right py-1"
                      />
                    </div>
                    <p className="text-sm font-medium text-white w-24 text-right">{formatCurrency(item.salePrice * item.quantity)}</p>
                    <button onClick={() => removeFromCart(item.productId)} className="text-dark-500 hover:text-red-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <div className="text-right">
                    <p className="text-dark-400 text-sm">Grand Total</p>
                    <p className="text-xl font-display font-bold text-brand-400">{formatCurrency(grandTotal)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer & Checkout */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-semibold text-white text-sm">Customer Details</h3>
            <div>
              <label className="label">Customer Name *</label>
              <input className="input" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {/* Khata toggle */}
            <div className="flex items-center gap-3 bg-dark-800 rounded-lg px-3 py-2.5">
              <input
                type="checkbox"
                id="isKhata"
                checked={isKhata}
                onChange={(e) => setIsKhata(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-500"
              />
              <label htmlFor="isKhata" className="text-sm text-dark-200 cursor-pointer flex-1">
                Credit Sale (Add to Khata)
              </label>
            </div>

            {isKhata && (
              <div>
                <label className="label">Customer Phone</label>
                <input className="input" placeholder="03xxxxxxxxx" value={khataPhone} onChange={(e) => setKhataPhone(e.target.value)} />
              </div>
            )}

            {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</div>}

            <div className="pt-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-dark-400 text-sm">Total</span>
                <span className="font-display font-bold text-white text-lg">{formatCurrency(grandTotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={saving || cart.length === 0}
                className="btn-primary w-full py-3 text-base disabled:opacity-50"
              >
                {saving ? "Processing..." : isKhata ? "🧾 Save as Khata" : "🧾 Complete Sale"}
              </button>
            </div>
          </div>

          {/* Last invoice */}
          {lastInvoice && (
            <div className="card bg-emerald-900/10 border-emerald-800/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-medium">Invoice Created!</span>
              </div>
              <p className="text-xs text-dark-400">#{lastInvoice.invoiceNo}</p>
              <p className="text-sm text-white">{lastInvoice.customerName}</p>
              <p className="text-sm font-medium text-brand-400">{formatCurrency(lastInvoice.grandTotal)}</p>
              <button onClick={() => setLastInvoice(null)} className="text-xs text-dark-500 hover:text-dark-300">Dismiss</button>
            </div>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-white">Recent Invoices</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Search..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="input pl-8 w-44 py-1.5 text-xs" />
            </div>
            <select value={invDateFilter} onChange={(e) => setInvDateFilter(e.target.value)} className="select w-36 py-1.5 text-xs">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Invoice #", "Customer", "Items", "Total", "Date"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center text-dark-500 py-8">No invoices found</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="table-row hover:bg-dark-800/30 transition-colors">
                  <td className="table-cell font-mono text-xs text-brand-400">{inv.invoiceNo}</td>
                  <td className="table-cell text-white">{inv.customerName}</td>
                  <td className="table-cell text-dark-400 text-xs">{inv.items?.length || 0} items</td>
                  <td className="table-cell font-medium text-white">{formatCurrency(inv.grandTotal)}</td>
                  <td className="table-cell text-dark-400 text-xs">{new Date(inv.createdAt).toLocaleDateString("en-PK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
