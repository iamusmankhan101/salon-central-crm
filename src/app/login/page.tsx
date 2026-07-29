import { BrandMark } from "@/components/brand-mark";
import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFAFA] flex items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-light/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-brand-indigo/20 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <BrandMark className="w-56 mx-auto mb-2" />
        <p className="text-sm text-slate-500 text-center mb-8">
          Sign in to your CRM
        </p>

        <form
          action={login}
          className="space-y-4 bg-white p-7 rounded-2xl border border-slate-200/70 shadow-xl shadow-brand/5"
        >
          {searchParams.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {searchParams.error}
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-brand to-brand-indigo text-white text-sm font-medium py-2.5 shadow-sm shadow-brand/30 hover:opacity-95 active:opacity-90 transition"
          >
            Sign in
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Salon Central CRM
        </p>
      </div>
    </div>
  );
}
