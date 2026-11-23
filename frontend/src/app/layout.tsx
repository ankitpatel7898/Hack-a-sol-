import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthGuard | Privacy-Preserving Healthcare & ZKP Insurance",
  description:
    "A secure healthcare insurance platform powered by Zero-Knowledge Proofs and Blockchain technology. Verify insurance claims without exposing private medical information.",
  keywords: ["ZKP", "Zero Knowledge Proof", "Healthcare", "Web3", "Blockchain", "Groth16", "Privacy"],
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
        {children}
      </body>
    </html>
  );
}
