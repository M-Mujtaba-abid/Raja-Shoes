export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function generateInvoiceNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `RS-${dateStr}-${rand}`;
}

export function getDateRange(filter: "today" | "week" | "month" | "all") {
  const now = new Date();
  const start = new Date();

  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "all":
      return { start: new Date(0), end: now };
  }

  return { start, end: now };
}

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
