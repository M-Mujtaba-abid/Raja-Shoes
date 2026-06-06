import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        amount: body.amount ? parseFloat(body.amount) : undefined,
        category: body.category || undefined,
        date: body.date ? new Date(body.date) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });
    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.expense.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
