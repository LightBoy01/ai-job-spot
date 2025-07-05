import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Job Spot", // Default title, will be overridden by Layout component
  description: "Find the latest jobs in Artificial Intelligence, Machine Learning, and Data Science.", // Default description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Script */}
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          ></script>
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
