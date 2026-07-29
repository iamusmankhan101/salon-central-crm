import Link from "next/link";
import { redirect } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import { importLeads } from "../actions";

const TEMPLATE_CSV = [
  "Name,Phone,Email,Company,Source,Status,Assigned To,Notes",
  "Jane Doe,555-0100,jane@example.com,Acme Salon,Referral,New,,First contact pending",
].join("\n");

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(
  TEMPLATE_CSV
)}`;

export default async function ImportLeadsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { profile } = await getCurrentUserAndProfile();
  if (profile?.role !== "admin") {
    redirect("/leads");
  }

  return (
    <div className="max-w-lg space-y-4">
      <Link href="/leads" className="text-sm text-slate-500 hover:underline">
        ← Back to pipeline
      </Link>

      <h1 className="text-xl font-semibold text-slate-900">Import Leads</h1>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {searchParams.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {searchParams.error}
          </p>
        )}

        <p className="text-sm text-slate-500">
          Upload a CSV with a header row. Only <strong>Name</strong> is
          required — <code className="text-xs">Phone, Email, Company,
          Source, Status, Assigned To, Notes</code> are all optional.
          Rows without a name are skipped. Unrecognized status values default
          to &ldquo;New&rdquo;; &ldquo;Assigned To&rdquo; is matched against a
          sales rep&apos;s name (leave blank for unassigned).
        </p>

        <a
          href={TEMPLATE_HREF}
          download="leads-template.csv"
          className="inline-block text-sm text-brand hover:text-brand-dark underline underline-offset-2"
        >
          Download a template CSV
        </a>

        <form action={importLeads} className="space-y-4 pt-2">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-dark file:px-3.5 file:py-2 file:text-sm file:font-medium hover:file:bg-brand-100"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-brand-indigo text-white text-sm font-medium px-4 py-2 shadow-sm shadow-brand/30 hover:opacity-95 transition"
          >
            <UploadCloud className="h-4 w-4" />
            Import
          </button>
        </form>
      </div>
    </div>
  );
}
