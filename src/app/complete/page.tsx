"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

function CompleteContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<{ success: boolean; points: number } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") verifyToken();
  }, [status, router]);

  async function verifyToken() {
    const token = searchParams.get("token");
    const surveyId = searchParams.get("survey_id");
    if (!token || !surveyId) {
      setResult({ success: false, points: 0 });
      setVerifying(false);
      return;
    }
    try {
      const res = await fetch("/api/completion-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, survey_id: surveyId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, points: data.points || 10 });
        toast.success(`+${data.points || 10} points earned!`);
      } else {
        setResult({ success: false, points: 0 });
        toast.error(data.error || "Invalid token");
      }
    } catch {
      setResult({ success: false, points: 0 });
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AppShell user={session?.user ?? {}}>
      <div style={{ maxWidth: 400, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        {verifying ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Verifying your response...</h1>
          </div>
        ) : result?.success ? (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Response verified!</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 8 }}>
              You earned <strong style={{ color: "var(--rl-teal)" }}>+{result.points} points</strong>
            </p>
            <button onClick={() => router.push("/feed")}
              style={{ padding: "10px 24px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Browse more surveys
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Verification failed</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
              The completion link may be invalid or expired. Complete the survey from the feed to generate a fresh token.
            </p>
            <button onClick={() => router.push("/feed")}
              style={{ padding: "10px 24px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Back to feed
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading...</div>}>
      <CompleteContent />
    </Suspense>
  );
}
