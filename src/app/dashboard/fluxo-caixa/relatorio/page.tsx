import { Suspense } from "react";
import RelatorioClient from "./RelatorioClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Carregando relatório...</div>}>
      <RelatorioClient />
    </Suspense>
  );
}
