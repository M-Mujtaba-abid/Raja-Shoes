import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const dateFilter = searchParams.get("dateFilter") || "all";

  const where: Record<string, unknown> = {};

  if (search) {
    where.notes = { contains: search, mode: "insensitive" };
  }

  if (["SALARY", "TAYA_JEE", "MUNEEB", "CZN", "OTHER"].includes(category)) {
    where.category = category;
  }

  if (dateFilter !== "all") {
    const now = new Date();
    const start = new Date();
    if (dateFilter === "today") start.setHours(0, 0, 0, 0);
    else if (dateFilter === "week") start.setDate(now.getDate() - 7);
    else if (dateFilter === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
    where.date = { gte: start, lte: now };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { amount, category, date, notes } = body;

    if (!amount || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
