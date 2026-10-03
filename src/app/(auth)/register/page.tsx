import Link from "next/link";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <>
      <h2 className="font-heading mb-1 text-[22px] font-semibold text-ink">
        Claim your blank page
      </h2>
      <p className="mb-6 text-[13.5px] text-muted">
        Free forever. Your thoughts stay yours.
      </p>
      <AuthForm mode="register" />
      <p className="mt-6 text-center text-[13.5px] text-muted">
        Already have a notepad?{" "}
        <Link
          href="/login"
          className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
