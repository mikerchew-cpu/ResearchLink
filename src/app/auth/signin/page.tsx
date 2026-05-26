"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (session) {
      if (session.user?.role === "admin") router.push("/admin");
      else router.push("/feed");
    }
  }, [session, router]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--rl-teal)", marginBottom: 4 }}>ResearchLink</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{t("auth.signin_subtitle")}</div>
        </div>

        <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "0.5px solid var(--color-border-tertiary)", padding: "32px 24px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--rl-teal-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--rl-teal)">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>{t("auth.signin_title")}</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{t("auth.signin_subtitle")}</p>
          </div>

          <button onClick={() => signIn("google", { callbackUrl: "/feed" })}
            style={{
              width: "100%", padding: "12px", background: "white",
              border: "0.5px solid var(--color-border-secondary)", borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("auth.signin_btn")}
          </button>

          <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--color-background-info)", borderRadius: 8, fontSize: 11, color: "var(--color-text-info)" }}>
            {t("auth.signin_note")}
          </div>
        </div>
      </div>
    </div>
  );
}
