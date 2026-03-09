// src/app/dashboard/dre/page.tsx
import { redirect } from "next/navigation";
import DrePageClient from "./DrePageClient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  // Se abrir /dashboard/dre sem ?id=...
  if (!id || id === "undefined") {
    redirect("/dashboard/historico"); // ajuste se quiser mandar pra outro lugar
  }

  return <DrePageClient id={id} />;
}