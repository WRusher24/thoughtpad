import { requireUser } from "@/lib/auth";
import { loadInitialData } from "@/lib/data";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

/** Protected stream — the auth wall redirects anonymous visitors. */
export default async function HomePage() {
  const user = await requireUser();
  const data = await loadInitialData(user);
  return <AppShell initialData={data} />;
}
