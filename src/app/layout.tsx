import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Lucro ML SaaS",
  description: "Dashboard profissional de gestão de vendas Mercado Livre",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
