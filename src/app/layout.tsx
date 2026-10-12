import type { Metadata } from "next";
import "@/frontend/styles/globals.css";
import { Providers } from "@/frontend/components/Providers";

export const metadata: Metadata = {
  title: "StockSync | Enterprise Retail Inventory & POS Billing",
  description: "Real-time retail inventory tracking, point-of-sale checkout, barcode scanning, and analytics.",
  keywords: ["POS", "Point of Sale", "Inventory", "Retail Management", "StockSync"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
