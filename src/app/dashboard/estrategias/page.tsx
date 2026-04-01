import { getUserPlan } from "@/lib/getUserPlan";
import StrategyUpgradeCard from "@/components/strategies/StrategyUpgradeCard";
import StrategiesClient from "./StrategiesClient";

export default async function EstrategiasPage() {
  const plan = await getUserPlan();

  const canAccessStrategies = plan === "plus";

  if (!canAccessStrategies) {
    return (
      <div className="min-h-screen text-white bg-neutral-950">
        <div className="px-4 py-6 mx-auto max-w-7xl md:px-6 lg:px-8">
          <StrategyUpgradeCard />
        </div>
      </div>
    );
  }

  return <StrategiesClient />;
}

