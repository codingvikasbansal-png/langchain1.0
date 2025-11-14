import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple ChatGPT UI",
  description: "A simple ChatGPT-like interface using assistant-ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


