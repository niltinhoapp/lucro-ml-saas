"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  nome?: string | null;
  arquivo_nome?: string | null;
  created_at?: string | null;
  dre?: {
    margem?: number | null;
    lucro?: number | null;
    receitaTotal?: number | null;
  } | null;
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

function pillFromMargem(m?: number | null) {
  const margem = Number(m ?? 0);
  if (margem >= 10) return { cls: "pill good", label: `Margem ${margem.toFixed(2)}%` };
  if (margem >= 0) return { cls: "pill warn", label: `Margem ${margem.toFixed(2)}%` };
  return { cls: "pill bad", label: `Margem ${margem.toFixed(2)}%` };
}

/** ✅ Produto real: nunca mostrar “Simulação” */
function tituloRelatorio(it: Item) {
  const nome = it?.nome?.trim() || "";

  // Se o banco tiver salvo “Simulação ...”, NÃO usa.
  if (nome && /^simula(ç|c)ão\b/i.test(nome)) {
    // tenta usar arquivo_nome
    if (it?.arquivo_nome?.trim()) return `Relatório — ${it.arquivo_nome.trim()}`;
    return `Relatório #${it.id.slice(0, 6).toUpperCase()}`;
  }

  // Nome custom bom
  if (nome) return nome;

  // Fallbacks
  if (it?.arquivo_nome?.trim()) return `Relatório — ${it.arquivo_nome.trim()}`;
  return `Relatório #${it.id.slice(0, 6).toUpperCase()}`;
}


export default function HistoricoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/simulacoes", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Falha ao carregar relatórios.");

      const list: Item[] = Array.isArray(json) ? json : (json?.items ?? []);
      setItems(list);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar relatórios.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const title = useMemo(() => `Relatórios`, []);

  return (
    <div className="page-wrap historico-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
          <div>
            <div className="hero-badge">
              <span className="dot" />
              PRO • Relatórios
            </div>

            <h1 style={{ fontSize: 28, marginTop: 12 }}>{title}</h1>

            <p style={{ marginTop: 8 }}>
              Abra um relatório salvo. Ao clicar em uma linha, você vai direto para o DRE.
            </p>
          </div>

          <div className="actions" style={{ justifyContent: "flex-end", alignItems: "flex-start" }}>
            <button className="btn-dark" onClick={() => router.push("/dashboard")}>
              ← Painel
            </button>

            <button className="btn-primary" onClick={() => router.push("/dashboard")}>
              + Novo relatório
            </button>

            <button className="btn-ghost" onClick={load} style={{ background: "rgba(255,255,255,.08)" }}>
              Recarregar
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      {loading ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Carregando…</h2>
              <p>Buscando seus relatórios.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="progress">
              <div className="progress-bar" style={{ width: "55%" }} />
            </div>
            <div className="small" style={{ marginTop: 10 }}>
              Aguarde alguns segundos…
            </div>
          </div>
        </section>
      ) : erro ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h2 style={{ color: "#fee2e2" }}>Erro ao carregar</h2>
              <p style={{ color: "rgba(229,231,235,.7)" }}>{erro}</p>
            </div>
          </div>
          <div className="card-body">
            <div className="alert danger">
              Verifique se existe a rota <code>/api/simulacoes</code> (GET) retornando a lista.
            </div>
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Nenhum relatório ainda</h2>
              <p>Faça upload no painel para gerar o primeiro relatório.</p>
            </div>
          </div>
          <div className="card-body">
            <Link className="btn-primary" href="/dashboard">
              Ir para upload
            </Link>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Relatórios salvos</h2>
              <p>Clique para abrir o relatório DRE.</p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="badge pro">⚡ PRO</span>
              <span className="small">{items.length} itens</span>
            </div>
          </div>

          <div className="list">
            {items.map((it) => {
              const pill = pillFromMargem(it?.dre?.margem ?? 0);
              const nome = tituloRelatorio(it);

              return (
                <div
                  key={it.id}
                  className="row"
                  onClick={() => router.push(`/dashboard/dre?id=${it.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/dre?id=${it.id}`);
                  }}
                >
                  <div>
                    <div className="title">{nome}</div>

                    <div className="meta">
                      {it?.arquivo_nome ? `Arquivo: ${it.arquivo_nome}` : "Arquivo não informado"}
                      {it?.created_at ? ` • Importado em ${fmtDateBR(it.created_at)}` : ""}
                    </div>
                  </div>

                  <div className="right">
                    <div className="pills">
                      <span className={pill.cls}>{pill.label}</span>

                      <span className="pill" style={{ background: "rgba(255,255,255,.06)" }}>
                        Lucro {moeda(it?.dre?.lucro)}
                      </span>
                    </div>

                    <div className="small" style={{ color: "rgba(229,231,235,.75)", fontWeight: 900 }}>
                      Abrir relatório →
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
