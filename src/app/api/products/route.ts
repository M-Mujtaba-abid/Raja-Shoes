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
      { articleName: { contains: search, mode: "insensitive" } },
      { size: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "IN_STOCK" || status === "OUT_OF_STOCK") {
    where.status = status;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { dateAdded: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { articleName, size, quantity, costPrice, salePrice, dateAdded, notes } = body;

    if (!articleName || !size || quantity == null || !costPrice || !salePrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        articleName,
        size: String(size),
        quantity: parseInt(quantity),
        costPrice: parseFloat(costPrice),
        salePrice: parseFloat(salePrice),
        status: parseInt(quantity) > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        dateAdded: dateAdded ? new Date(dateAdded) : new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
