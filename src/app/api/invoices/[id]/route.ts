import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: true, khataEntry: { include: { payments: true } } },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(invoice);
}
