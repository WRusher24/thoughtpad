"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { login, register, type AuthFormState } from "@/actions/auth";

const initial: AuthFormState = { error: null };

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? login : register;
  const [state, formAction, isPending] = useActionState(action, initial);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      {!isLogin && (
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Display name <span className="normal-case tracking-normal">(optional)</span>
          </span>
          <input
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Sara"
            maxLength={40}
            className="input-ink"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Username
        </span>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="sara.writes"
          className="input-ink"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder={isLogin ? "Your password" : "At least 8 characters"}
          className="input-ink"
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-[#e5c8bf] bg-[#f8e9e4] px-3 py-2 text-[13px] text-[#8f4e2e]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-ink mt-1 flex h-11 items-center justify-center gap-2 text-[15px]"
      >
        {isPending ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : (
          <>
            {isLogin ? "Open my notepad" : "Create my notepad"}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
