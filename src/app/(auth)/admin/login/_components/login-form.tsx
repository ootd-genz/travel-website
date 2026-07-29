"use client";

import { useActionState } from "react";

import { loginAdmin, type AdminLoginState } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const initialState: AdminLoginState = { message: null, fieldErrors: {} };
  const [state, action, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email admin
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(state.fieldErrors.email)}
          aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
          required
        />
        {state.fieldErrors.email?.[0] ? (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors.password)}
          aria-describedby={state.fieldErrors.password ? "password-error" : undefined}
          required
        />
        {state.fieldErrors.password?.[0] ? (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Memeriksa akun..." : "Masuk ke Dashboard"}
      </Button>
    </form>
  );
}
