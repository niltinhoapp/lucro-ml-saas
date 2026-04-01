"use client";

import { useMemo, useState } from "react";
import { Bell, ChevronRight, Sparkles, Target } from "lucide-react";

type Strategy = {
  id: string;
  title: string;
  category: string;
  readTime: string;
  content: string;
  isNew: boolean;
  isRead: boolean;
};

const initialStrategies: Strategy[] = [
  {
    id: "1",
    title: "Preço Âncora",
    category: "Precificação",
    readTime: "3 min",
    content: "Como criar espaço para promoções agressivas sem destruir sua margem.",
    isNew: true,
    isRead: false,
  },
  {
    id: "2",
    title: "Escada de Preço",
    category: "Ranking",
    readTime: "4 min",
    content: "Pequenas variações para estimular vendas e manter relevância.",
    isNew: false,
    isRead: true,
  },
  {
    id: "3",
    title: "Domínio de Categoria",
    category: "Escala",
    readTime: "5 min",
    content: "Como dominar múltiplos espaços no ranking.",
    isNew: true,
    isRead: false,
  },
];

const filters = ["todas", "novas", "lidas"];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [activeFilter, setActiveFilter] = useState("todas");
  const [selected, setSelected] = useState<Strategy | null>(strategies[0]);

  const filtered = useMemo(() => {
    if (activeFilter === "novas") return strategies.filter(s => !s.isRead);
    if (activeFilter === "lidas") return strategies.filter(s => s.isRead);
    return strategies;
  }, [strategies, activeFilter]);

  function markAsRead(id: string) {
    setStrategies(prev =>
      prev.map(s =>
        s.id === id ? { ...s, isRead: true, isNew: false } : s
      )
    );
  }

  const unreadCount = strategies.filter(s => !s.isRead).length;

  return (
    <div className="lm-strategies">
      <header className="lm-strategies-header">
        <div>
          <div className="lm-chip">
            <Sparkles size={14} /> Inteligência Estratégica
          </div>
          <h1>Central de Estratégias</h1>
          <p>Decisões melhores, com base prática.</p>
        </div>

        <div className="lm-strategies-kpis">
          <div>
            <Bell size={16} />
            <strong>{unreadCount}</strong>
            <span>não lidas</span>
          </div>
          <div>
            <Target size={16} />
            <strong>Execução</strong>
            <span>semanal</span>
          </div>
        </div>
      </header>

      <div className="lm-strategies-body">
        <div className="lm-strategies-list">
          <div className="lm-filters">
            {filters.map(f => (
              <button
                key={f}
                className={activeFilter === f ? "active" : ""}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.map(item => (
            <div
              key={item.id}
              className={`lm-card ${selected?.id === item.id ? "selected" : ""}`}
              onClick={() => setSelected(item)}
            >
              <div className="lm-card-top">
                <h3>{item.title}</h3>
                <span className={`badge ${item.isRead ? "read" : "new"}`}>
                  {item.isRead ? "Lida" : "Nova"}
                </span>
              </div>

              <span className="meta">
                {item.category} • {item.readTime}
              </span>

              <p>{item.content}</p>

              <ChevronRight size={16} />
            </div>
          ))}
        </div>

        <div className="lm-strategies-view">
          {selected && (
            <>
              <h2>{selected.title}</h2>
              <p>{selected.content}</p>

              <button
                className="lm-btn-primary"
                onClick={() => markAsRead(selected.id)}
              >
                Marcar como lida
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}