import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import RadarOportunidades from "@/features/produtos/radar/components/RadarOportunidades";

export default async function RadarPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/radar");
  }

  return <RadarOportunidades />;
}

