"use client";

import { useState } from "react";
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

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          width: "100%",
          textAlign: "inherit",
          cursor: "pointer",
        }}
      >
        {children}
      </button>

      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        plan={plan}
        title={title}
        description={description}
        feature={feature}
      />
    </>
  );
}
