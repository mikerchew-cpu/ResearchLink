"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

interface ModerationItem {
  id: string; survey_id: string; title: string; reason: string;
  reported_by?: string; created_at: string;
}

export default function ModerationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated" && session?.user?.role !== "admin") { router.push("/feed"); return; }
    if (status === "authenticated") fetchQueue();
  }, [status, session, router]);

  async function fetchQueue() {
    try {
      const res = await fetch("/api/moderation?queue=true");
      const data = await res.json();
      setItems(data.queue || []);
    } catch {}
  }

  async function handleAction(surveyId: string, action: "approve" | "reject") {
    setActionLoading(surveyId);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/${action}`, { method: "POST" });
      if (res.ok) {
        toast.success(`Survey ${action}d`);
        fetchQueue();
      } else {
        toast.error(`Failed to ${action}`);
      }
    } catch {
      toast.error(`Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="admin">
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Moderation Queue</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
          {items.length} items pending review
        </p>

        {items.length === 0 ? (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "32px", textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)" }}>
            No items pending moderation.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 2 }}>Reason: {item.reason}</div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 12 }}>
                  Reported {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleAction(item.survey_id, "approve")} disabled={actionLoading === item.survey_id}
                    style={{ padding: "8px 20px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {actionLoading === item.survey_id ? "..." : "Approve"}
                  </button>
                  <button onClick={() => handleAction(item.survey_id, "reject")} disabled={actionLoading === item.survey_id}
                    style={{ padding: "8px 20px", background: "var(--rl-coral)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {actionLoading === item.survey_id ? "..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
