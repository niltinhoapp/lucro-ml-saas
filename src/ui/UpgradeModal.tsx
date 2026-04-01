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

export default function UpgradeModal({
  open,
  onClose,
  plan,
  title,
  description,
  feature,
}: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div
      className="upgrade-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
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
            Plano {getPlanLabel(plan)}
          </span>

          <div className="upgrade-modal-icon">
            <Sparkles size={22} />
          </div>
        </div>

        <h2 id="upgrade-modal-title" className="upgrade-modal-title">
          Desbloqueie: {feature}
        </h2>

        <p className="upgrade-modal-subtitle">{title}</p>

        <div className="upgrade-modal-highlight">
          <div className="upgrade-modal-highlight-icon">
            <Lock size={16} />
          </div>

          <div>
            <strong>Esse recurso exige o plano {getPlanLabel(plan)}</strong>
            <p>{description}</p>
          </div>
        </div>

        <div className="upgrade-modal-points">
          <div className="upgrade-modal-point">
            <span className="upgrade-modal-point-label">Benefício</span>
            <strong>
              {plan === "plus"
                ? "Mais inteligência para encontrar oportunidades"
                : "Mais controle para proteger sua margem"}
            </strong>
          </div>

          <div className="upgrade-modal-point">
            <span className="upgrade-modal-point-label">Resultado</span>
            <strong>
              {plan === "plus"
                ? "Decisões melhores antes de comprar ou anunciar"
                : "Mais clareza financeira antes de investir"}
            </strong>
          </div>
        </div>

        <div className="upgrade-modal-actions">
          <Link href={getUpgradeHref(plan)} className="btn btn-primary">
            Fazer upgrade para {getPlanLabel(plan)}
          </Link>

          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Continuar depois
          </button>
        </div>
      </div>
    </div>
  );
}

