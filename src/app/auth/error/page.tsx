"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERRORS: Record<string, { title: string; body: string }> = {
  "not-edu-email": {
    title: "University email required",
    body:  "ResearchLink is only available to students and staff at Malaysian universities. Please sign in with your official .edu.my institutional email address.",
  },
  OAuthSignin:     { title: "Sign-in failed", body: "Could not connect to Google. Please try again." },
  OAuthCallback:   { title: "Sign-in failed", body: "Google returned an error. Please try again." },
  OAuthAccountNotLinked: {
    title: "Account conflict",
    body:  "This email is already registered with a different sign-in method. Please use the original method.",
  },
  default: {
    title: "Something went wrong",
    body:  "We could not sign you in. Please try again or contact support@researchlink.my",
  },
};

function ErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? params.get("error") ?? "default";
  const err    = ERRORS[reason] ?? ERRORS.default;

  return (
    <div style={{ minHeight: "100dvh", background: "#F1EFE8", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 420, width: "100%", background: "white", borderRadius: 16, border: "0.5px solid #D3D1C7", padding: "32px 28px", textAlign: "center" }}>

        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#E24B4A">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: "0 0 10px" }}>{err.title}</h1>
        <p style={{ fontSize: 14, color: "#5F5E5A", lineHeight: 1.7, margin: "0 0 24px" }}>{err.body}</p>

        {reason === "not-edu-email" && (
          <div style={{ background: "#E1F5EE", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#0F6E56", textAlign: "left" }}>
            <strong>Which email should I use?</strong>
            <br />Your official university email &mdash; e.g. <code>student123@xmu.edu.my</code> or <code>name@um.edu.my</code>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/auth/signin"
            style={{ padding: "12px", background: "#1D9E75", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "block" }}>
            Try signing in again
          </Link>
          <a href="mailto:support@researchlink.my"
            style={{ padding: "12px", background: "none", border: "0.5px solid #D3D1C7", color: "#5F5E5A", borderRadius: 10, fontSize: 13, textDecoration: "none", display: "block" }}>
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
