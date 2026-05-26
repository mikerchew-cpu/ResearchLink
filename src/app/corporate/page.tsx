"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

export default function CorporatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState("");
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [budget, setBudget] = useState("5000");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
  }, [status, router]);

  async function handleSubmit() {
    if (!brand || !objective) { toast.error("Brand and objective are required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/corporate/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, objective, target_audience: targetAudience, budget_myr: Number(budget) }),
      });
      if (!res.ok) throw new Error("Failed");
      setStep(3);
      toast.success("Campaign submitted! We'll contact you within 24 hours.");
    } catch {
      toast.error("Failed to submit campaign");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Insight Blast</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
          Launch a brand campaign with verified Malaysian students
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "var(--rl-teal)" : "var(--color-border-tertiary)" }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Brand name</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. ZUS Coffee" style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Campaign objective</label>
              <textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="e.g. Brand perception among Klang Valley university students" rows={3} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }} />
            </div>
            <button onClick={() => setStep(2)} disabled={!brand || !objective}
              style={{ width: "100%", padding: "11px", background: (brand && objective) ? "var(--rl-teal)" : "var(--color-border-tertiary)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (brand && objective) ? "pointer" : "not-allowed" }}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Target audience</label>
              <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g. 18-24, Klang Valley, Business students" style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Budget (RM)</label>
              <select value={budget} onChange={e => setBudget(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }}>
                <option value="5000">RM 5,000 - Starter</option>
                <option value="10000">RM 10,000 - Standard</option>
                <option value="25000">RM 25,000 - Premium</option>
                <option value="50000">RM 50,000+ - Enterprise</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ padding: "11px 20px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ flex: 1, padding: "11px", background: submitting ? "#9FE1CB" : "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Submitting..." : "Submit campaign"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ background: "var(--rl-teal-light)", border: "0.5px solid var(--color-border-success)", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--rl-teal-dark)", margin: "0 0 8px" }}>Campaign submitted!</h2>
            <p style={{ fontSize: 13, color: "var(--rl-teal-dark)", margin: 0 }}>
              Our team will review and reach out within 24 hours.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
