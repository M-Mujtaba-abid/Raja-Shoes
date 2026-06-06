import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (["PENDING", "PARTIAL", "CLEARED"].includes(status)) {
    where.status = status;
  }

  const accounts = await prisma.khataAccount.findMany({
    where,
    include: {
      payments: { orderBy: { date: "asc" } },
      invoice: { select: { invoiceNo: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { customerName, phone, totalBillAmount, notes } = body;

    if (!customerName || !totalBillAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const account = await prisma.khataAccount.create({
      data: {
        customerName,
        phone: phone || null,
        totalBillAmount: parseFloat(totalBillAmount),
        totalPaid: 0,
        remainingBalance: parseFloat(totalBillAmount),
        status: "PENDING",
        notes: notes || null,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create khata account" }, { status: 500 });
  }
}
