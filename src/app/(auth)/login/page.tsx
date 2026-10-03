import Link from "next/link";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h2 className="font-heading mb-6 text-[22px] font-semibold text-ink">
        Welcome back
      </h2>
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-[13.5px] text-muted">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
        >
          Create your notepad
        </Link>
      </p>
      <p className="mt-5 rounded-lg border border-dashed border-line bg-cream px-3 py-2 text-center text-[12px] text-muted">
        Demo account — user <span className="font-semibold text-ink">demo</span>,
        password <span className="font-semibold text-ink">thoughtpad123</span>
      </p>
    </>
  );
}
