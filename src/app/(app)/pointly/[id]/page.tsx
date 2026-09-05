import { LeadDetail } from "@/components/leads/lead-detail";

export default function Page({ params }: { params: { id: string } }) {
  return <LeadDetail product="pointly" leadId={params.id} />;
}
