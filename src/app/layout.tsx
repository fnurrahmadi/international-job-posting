import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relocate Jobs",
  description: "International analytics, data, ML, and product roles with visa and relocation signals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
