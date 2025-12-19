import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Genki TCG - Tournament Management Made Easy",
  description: "The ultimate tournament management platform for TCG players. Track rankings, manage tournaments, and compete with players worldwide.",
  keywords: "TCG, tournament, card game, rankings, One Piece TCG, Azuki TCG, Riftbound",
  authors: [{ name: "Genki TCG" }],
  openGraph: {
    title: "Genki TCG - Tournament Management Made Easy",
    description: "The ultimate tournament management platform for TCG players.",
    type: "website",
    siteName: "Genki TCG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Genki TCG",
    description: "Tournament management platform for TCG players",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black`}>
        {children}
      </body>
    </html>
  );
}
