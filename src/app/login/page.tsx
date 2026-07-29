import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">
          Salon Central CRM
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          Sign in to view your leads
        </p>

        <form
          action={login}
          className="space-y-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm"
        >
          {searchParams.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800 transition"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
