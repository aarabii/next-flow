import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { Inter, Google_Sans_Flex, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const googleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans-flex",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Next Flow",
  description: "A demo app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${googleSansFlex.variable} ${jetBrainsMono.variable}`}
    >
      <body className="antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
