import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { generateInvoiceNo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const dateFilter = searchParams.get("dateFilter") || "all";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { invoiceNo: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFilter !== "all") {
    const now = new Date();
    const start = new Date();
    if (dateFilter === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (dateFilter === "week") {
      start.setDate(now.getDate() - 7);
    } else if (dateFilter === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    where.createdAt = { gte: start, lte: now };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { items: true, khataEntry: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { customerName, items, isKhata, khataPhone, notes } = body;
    // items: Array<{ productId, quantity, salePrice }>

    if (!customerName || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch products to get cost prices and validate stock
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock availability
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.articleName}" (Size: ${product.size}). Available: ${product.quantity}` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let grandTotal = 0;
    let totalCost = 0;
    const invoiceItems = items.map((item: { productId: string; quantity: number; salePrice: number }) => {
      const product = productMap.get(item.productId)!;
      const costPrice = parseFloat(String(product.costPrice));
      const salePrice = parseFloat(String(item.salePrice));
      const qty = item.quantity;
      const subtotal = salePrice * qty;
      const itemCost = costPrice * qty;
      const itemProfit = subtotal - itemCost;

      grandTotal += subtotal;
      totalCost += itemCost;

      return {
        productId: item.productId,
        articleName: product.articleName,
        size: product.size,
        quantity: qty,
        costPrice,
        salePrice,
        itemProfit,
        subtotal,
      };
    });

    const grossProfit = grandTotal - totalCost;
    const invoiceNo = generateInvoiceNo();

    // Create invoice + items + deduct stock in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          customerName,
          grandTotal,
          totalCost,
          grossProfit,
          notes: notes || null,
          items: {
            create: invoiceItems,
          },
        },
        include: { items: true },
      });

      // Deduct stock for each item
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const newQty = product.quantity - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: newQty,
            status: newQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
          },
        });
      }

      // Create Khata entry if credit sale
      if (isKhata) {
        await tx.khataAccount.create({
          data: {
            customerName,
            phone: khataPhone || null,
            invoiceId: inv.id,
            totalBillAmount: grandTotal,
            totalPaid: 0,
            remainingBalance: grandTotal,
            status: "PENDING",
          },
        });
      }

      return inv;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
