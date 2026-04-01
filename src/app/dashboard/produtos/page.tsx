import Link from "next/link";
import { Package, Radar, BookOpen, FileText } from "lucide-react";

export default function ProdutosPage() {
  return (
    <div className="lm-produtos-page">
      <header className="lm-produtos-header">
        <h1>Produtos</h1>
        <p>
          Escolha o que você quer analisar. Aqui é onde você decide o que comprar,
          testar ou escalar.
        </p>
      </header>

      <section className="lm-produtos-grid">
        <Link href="/dashboard/produtos/radar" className="lm-produtos-card">
          <Radar size={22} />
          <div>
            <strong>Radar ML</strong>
            <p>Descubra oportunidades com base em dados reais.</p>
          </div>
        </Link>

        <Link href="/dashboard/produtos/catalogos" className="lm-produtos-card">
          <FileText size={22} />
          <div>
            <strong>Catálogos</strong>
            <p>Analise PDFs de fornecedores e identifique produtos.</p>
          </div>
        </Link>

        <Link href="/dashboard/produtos/estrategias" className="lm-produtos-card">
          <BookOpen size={22} />
          <div>
            <strong>Estratégias</strong>
            <p>Decida como vender melhor com base no cenário.</p>
          </div>
        </Link>
      </section>
    </div>
  );
}


