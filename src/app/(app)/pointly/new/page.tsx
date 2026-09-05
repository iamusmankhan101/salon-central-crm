import { NewLeadForm } from "@/components/leads/new-lead-form";

export default function Page({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <NewLeadForm product="pointly" error={searchParams.error} />;
}
