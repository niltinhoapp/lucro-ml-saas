"use client";

import Link from "next/link";
import { Crown, Lock, Sparkles, X } from "lucide-react";

type UpgradePlan = "pro" | "plus";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  plan: UpgradePlan;
  title: string;
  description: string;
  feature: string;
};

function getPlanLabel(plan: UpgradePlan) {
  return plan === "plus" ? "PLUS" : "PRO";
}

function getUpgradeHref(plan: UpgradePlan) {
  return plan === "plus" ? "/checkout?plan=plus" : "/checkout?plan=pro";
}

function getBenefit(plan: UpgradePlan) {
  if (plan === "plus") {
    return "Mais inteligência para decidir antes de comprar ou anunciar.";
  }

  return "Mais controle para proteger margem e operar com mais segurança.";
}

function getResult(plan: UpgradePlan) {
  if (plan === "plus") {
    return "Mais clareza para encontrar oportunidades reais.";
  }

  return "Mais visão para decidir com base em lucro e operação.";
}

export default function UpgradeModal({
  open,
  onClose,
  plan,
  title,
  description,
  feature,
}: UpgradeModalProps) {
  if (!open) return null;

  const planLabel = getPlanLabel(plan);
  const upgradeHref = getUpgradeHref(plan);

  return (
    <div
      className="upgrade-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      aria-describedby="upgrade-modal-description"
    >
      <div
        className="upgrade-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="upgrade-modal-close"
          onClick={onClose}
          aria-label="Fechar modal"
        >
          <X size={18} />
        </button>

        <div className="upgrade-modal-top">
          <span className="upgrade-modal-badge">
            <Crown size={14} />
            Plano {planLabel}
          </span>

          <div className="upgrade-modal-icon" aria-hidden="true">
            <Sparkles size={22} />
          </div>
        </div>

        <h2 id="upgrade-modal-title" className="upgrade-modal-title">
          Desbloqueie {feature}
        </h2>

        <p id="upgrade-modal-description" className="upgrade-modal-subtitle">
          {title}
        </p>

        <div className="upgrade-modal-highlight">
          <div className="upgrade-modal-highlight-icon" aria-hidden="true">
            <Lock size={16} />
          </div>

          <div>
            <strong>Esse recurso exige o plano {planLabel}</strong>
            <p>{description}</p>
          </div>
        </div>

        <div className="upgrade-modal-points">
          <div className="upgrade-modal-point">
            <span className="upgrade-modal-point-label">Benefício</span>
            <strong>{getBenefit(plan)}</strong>
          </div>

          <div className="upgrade-modal-point">
            <span className="upgrade-modal-point-label">Resultado</span>
            <strong>{getResult(plan)}</strong>
          </div>
        </div>

        <div className="upgrade-modal-actions">
          <Link href={upgradeHref} className="btn btn-primary">
            Fazer upgrade para {planLabel}
          </Link>

          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Continuar depois
          </button>
        </div>
      </div>
    </div>
  );
}