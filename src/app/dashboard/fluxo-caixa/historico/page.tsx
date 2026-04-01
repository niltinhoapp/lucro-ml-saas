"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  nome?: string | null;
  arquivo_nome?: string | null;
  created_at?: string | null;
  total_lancamentos?: number | null;
  entradas_total?: number | null;
  saidas_total?: number | null;
  saldo_liquido?: number | null;
  periodo_inicio?: string | null;
  periodo_fim?: string | null;
};

function fmtDateBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

function moeda(v?: number | null) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function tituloRelatorio(it: Item) {
  if (it?.nome?.trim()) return it.nome.trim();
  if (it?.arquivo_nome?.trim()) return it.arquivo_nome.trim();
  return `Relatório #${it.id.slice(0, 6).toUpperCase()}`;
}

function pillSaldo(saldo?: number | null) {
  const s = Number(saldo ?? 0);
  if (s > 0) return { cls: "pill good", label: `Saldo ${moeda(s)}` };
  if (s === 0) return { cls: "pill warn", label: `Saldo ${moeda(s)}` };
  return { cls: "pill bad", label: `Saldo ${moeda(s)}` };
}

export default function HistoricoFluxoCaixaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/caixa", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Falha ao carregar histórico.");

      const list: Item[] = Array.isArray(json) ? json : json?.items ?? [];
      setItems(list);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar histórico.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const title = useMemo(() => "Histórico", []);

  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-inner" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
          <div>
            <div className="hero-badge">
              <span className="dot" />
              Fluxo de caixa
            </div>

            <h1 style={{ fontSize: 28, marginTop: 12 }}>{title}</h1>
            <p style={{ marginTop: 8 }}>Abra seus relatórios salvos.</p>
          </div>

          <div
            className="actions"
            style={{ justifyContent: "flex-end", alignItems: "flex-start" }}
          >
            <button
              className="btn-dark"
              onClick={() => router.push("/dashboard/fluxo-caixa")}
            >
              Voltar
            </button>

            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard/fluxo-caixa")}
            >
              Novo relatório
            </button>

            <button
              className="btn"
              onClick={load}
              style={{ background: "rgba(255,255,255,.08)" }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="card-premium" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 950 }}>Carregando...</h3>
          <div style={{ marginTop: 14 }} className="progress">
            <div style={{ width: "55%" }} />
          </div>
        </section>
      ) : erro ? (
        <section className="card-premium" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 950, color: "#fee2e2" }}>Não foi possível carregar</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            {erro}
          </p>
        </section>
      ) : items.length === 0 ? (
        <section className="card-premium" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 950 }}>Nenhum relatório</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Importe um extrato para começar.
          </p>

          <div style={{ marginTop: 12 }}>
            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard/fluxo-caixa")}
            >
              Importar extrato
            </button>
          </div>
        </section>
      ) : (
        <section className="card-premium">
          <div
            style={{
              padding: 18,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3 style={{ fontWeight: 950 }}>Relatórios</h3>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="small">{items.length} itens</span>
            </div>
          </div>

          <div className="list">
            {items.map((it) => {
              const nome = tituloRelatorio(it);
              const saldoPill = pillSaldo(it.saldo_liquido ?? 0);

              return (
                <div
                  key={it.id}
                  className="row"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    router.push(`/dashboard/fluxo-caixa/relatorio?id=${it.id}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/dashboard/fluxo-caixa/relatorio?id=${it.id}`);
                    }
                  }}
                >
                  <div>
                    <div className="title">{nome}</div>
                    <div className="meta">
                      {it.created_at ? fmtDateBR(it.created_at) : "Sem data"}
                    </div>
                  </div>

                  <div className="right">
                    <div className="pills">
                      {typeof it.saldo_liquido === "number" ? (
                        <span className={saldoPill.cls}>{saldoPill.label}</span>
                      ) : null}

                      {typeof it.total_lancamentos === "number" ? (
                        <span
                          className="pill"
                          style={{ background: "rgba(255,255,255,.06)" }}
                        >
                          {it.total_lancamentos} lanç.
                        </span>
                      ) : null}
                    </div>

                    <div
                      className="small"
                      style={{ color: "rgba(229,231,235,.75)", fontWeight: 900 }}
                    >
                      Abrir
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}