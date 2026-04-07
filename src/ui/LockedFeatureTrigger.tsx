"use client";

import { useId, useState } from "react";
import UpgradeModal from "@/ui/UpgradeModal";

type UpgradePlan = "pro" | "plus";

type LockedFeatureTriggerProps = {
  plan: UpgradePlan;
  feature: string;
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
};

export default function LockedFeatureTrigger({
  plan,
  feature,
  title,
  description,
  className,
  children,
}: LockedFeatureTriggerProps) {
  const [open, setOpen] = useState(false);
  const modalTitleId = useId();

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={["locked-feature-trigger", className].filter(Boolean).join(" ")}
        onClick={openModal}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={modalTitleId}
      >
        {children}
      </button>

      <UpgradeModal
        open={open}
        onClose={closeModal}
        plan={plan}
        title={title}
        description={description}
        feature={feature}
      />
    </>
  );
}
