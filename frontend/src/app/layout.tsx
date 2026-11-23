import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "HealthShield | Privacy-Preserving Healthcare & Zero-Trust ZKP Insurance",
  description:
    "A zero-trust healthcare insurance platform powered by Zero-Knowledge Proofs, Argon2id, and AES-256-GCM envelope encryption.",
  keywords: ["ZKP", "Zero Knowledge Proof", "Healthcare", "Web3", "Blockchain", "Groth16", "Privacy", "Argon2id", "AES-256-GCM"],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-brandBg text-textMain">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
