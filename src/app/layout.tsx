import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raja Shoes — Business Management",
  description: "Complete business management system for Raja Shoes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
