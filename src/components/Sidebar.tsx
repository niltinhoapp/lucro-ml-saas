import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 p-6 bg-white border-r border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Lucro ML</h2>
      <nav className="flex flex-col gap-3">
        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <Link href="/dashboard/dre" className="hover:text-blue-600">DRE</Link>
        <Link href="/dashboard/fluxo-caixa" className="hover:text-blue-600">Fluxo de Caixa</Link>
        <Link href="/dashboard/full-vs-flex" className="hover:text-blue-600">Full vs Flex</Link>
      </nav>
    </aside>
  );
}
