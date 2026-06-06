import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateFilter = searchParams.get("dateFilter") || "month";

  const now = new Date();
  const start = new Date();

  if (dateFilter === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (dateFilter === "week") {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (dateFilter === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setFullYear(2000);
  }

  const dateRange = { gte: start, lte: now };

  // Parallel queries
  const [
    invoices,
    expenses,
    totalProducts,
    lowStockProducts,
    pendingKhata,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { createdAt: dateRange },
      _sum: { grandTotal: true, grossProfit: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: dateRange },
      _sum: { amount: true },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { quantity: { lte: 5 }, status: "IN_STOCK" } }),
    prisma.khataAccount.aggregate({
      where: { status: { in: ["PENDING", "PARTIAL"] } },
      _sum: { remainingBalance: true },
      _count: true,
    }),
  ]);

  const grossProfit = parseFloat(String(invoices._sum.grossProfit ?? 0));
  const totalExpenses = parseFloat(String(expenses._sum.amount ?? 0));
  const netProfit = grossProfit - totalExpenses;

  return NextResponse.json({
    totalSales: parseFloat(String(invoices._sum.grandTotal ?? 0)),
    totalInvoices: invoices._count,
    grossProfit,
    totalExpenses,
    netProfit,
    totalProducts,
    lowStockProducts,
    pendingKhataCount: pendingKhata._count,
    pendingKhataAmount: parseFloat(String(pendingKhata._sum.remainingBalance ?? 0)),
  });
}
