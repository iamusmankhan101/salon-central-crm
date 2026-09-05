import {
  LeadsPipeline,
  type LeadsSearchParams,
} from "@/components/leads/leads-pipeline";

export default function Page({
  searchParams,
}: {
  searchParams: LeadsSearchParams;
}) {
  return <LeadsPipeline product="pointly" searchParams={searchParams} />;
}
