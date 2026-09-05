import { ImportLeadsForm } from "@/components/leads/import-leads-form";

export default function Page({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <ImportLeadsForm product="pointly" error={searchParams.error} />;
}
