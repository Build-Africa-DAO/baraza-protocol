import type { Metadata } from "next";
import { WalletProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baraza — African Community Infrastructure on Solana",
  description:
    "Launch a DAO, host on-chain events, govern your treasury — from any phone, in any African city. M-Pesa accepted.",
  openGraph: {
    title: "Baraza Protocol",
    description: "African cooperative infrastructure on Solana",
    siteName: "Baraza",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baraza Protocol",
    description: "African cooperative infrastructure on Solana",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WalletProviders>{children}</WalletProviders>
      </body>
    </html>
  );
}
