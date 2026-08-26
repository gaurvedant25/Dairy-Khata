"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Account created — please sign in");
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4E220F]">Dairy Ledger</h1>
          <p className="mt-1 text-sm text-slate-500">Create your account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-[#FBF3D1] p-6 border border-[#E0CB9E]">
          <div>
            <label className="block text-sm font-medium text-slate-700">Your name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6BE8C] px-3 py-2 text-base focus:border-[#9D6638] focus:outline-none focus:ring-1 focus:ring-[#9D6638]"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              required
              minLength={3}
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6BE8C] px-3 py-2 text-base focus:border-[#9D6638] focus:outline-none focus:ring-1 focus:ring-[#9D6638]"
              autoComplete="username"
            />
            <p className="mt-1 text-xs text-slate-400">Letters, numbers, and . _ - — no spaces.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6BE8C] px-3 py-2 text-base focus:border-[#9D6638] focus:outline-none focus:ring-1 focus:ring-[#9D6638]"
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#9D6638] py-2.5 text-base font-medium text-white hover:bg-[#4E220F] disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#9D6638] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
