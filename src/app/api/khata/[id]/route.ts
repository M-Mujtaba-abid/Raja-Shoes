import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.khataAccount.findUnique({
    where: { id: params.id },
    include: {
      payments: { orderBy: { date: "asc" } },
      invoice: { include: { items: true } },
    },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

// Add a payment to a khata account
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { amount, date, notes } = body;

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const account = await prisma.khataAccount.findUnique({ where: { id: params.id } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const paymentAmount = parseFloat(amount);
    const newTotalPaid = parseFloat(String(account.totalPaid)) + paymentAmount;
    const newRemaining = parseFloat(String(account.totalBillAmount)) - newTotalPaid;

    let newStatus: "PENDING" | "PARTIAL" | "CLEARED" = "PARTIAL";
    if (newRemaining <= 0) newStatus = "CLEARED";
    else if (newTotalPaid === 0) newStatus = "PENDING";

    const [payment] = await prisma.$transaction([
      prisma.khataPayment.create({
        data: {
          accountId: params.id,
          amount: paymentAmount,
          date: date ? new Date(date) : new Date(),
          notes: notes || null,
        },
      }),
      prisma.khataAccount.update({
        where: { id: params.id },
        data: {
          totalPaid: newTotalPaid,
          remainingBalance: Math.max(0, newRemaining),
          status: newStatus,
        },
      }),
    ]);

    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 });
  }
}
