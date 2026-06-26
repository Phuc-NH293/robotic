import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inspectra — Robot Vision Quality Control",
  description: "Nền tảng kiểm tra chất lượng tự động bằng robot và AI thị giác.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
