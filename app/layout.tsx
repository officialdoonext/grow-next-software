import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GrowNext | SMART RETAIL",
  description: "GrowNext Smart Retail Platform powered by Doonext",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#fafafc] text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
