"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";

export default function ReferralPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [count, setCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      fetch("/api/referral").then(r => r.json()).then(d => {
        setCode(d.code || "");
        setCount(d.count || 0);
        setPoints(d.points || 0);
      }).catch(() => {});
      fetch("/api/referral?leaderboard=true").then(r => r.json()).then(d => {
        setLeaderboard(d.leaderboard || []);
      }).catch(() => {});
    }
  }, [status, router]);

  async function handleCopy() {
    const link = `${window.location.origin}/?ref=${code}`;
    await navigator.clipboard.writeText(link);
    toast.success(t("profile.referral_copy_btn") + "!");
  }

  async function handleWhatsApp() {
    const link = `${window.location.origin}/?ref=${code}`;
    const msg = encodeURIComponent(`Join ResearchLink Malaysia! Complete FYP surveys and earn rewards. Sign up here: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="referral">
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{t("profile.referral_section")}</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
          Invite friends, earn bonus points
        </p>

        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{t("profile.referral_code_label")}</div>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <code style={{ fontSize: 20, fontWeight: 700, color: "var(--rl-teal)", letterSpacing: 2 }}>{code || "—"}</code>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} style={{ flex: 1, padding: "10px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {t("profile.referral_copy_btn")}
            </button>
            <button onClick={handleWhatsApp} style={{ flex: 1, padding: "10px", background: "#25D366", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {t("profile.referral_whatsapp_btn")}
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
            {t("profile.referral_stats", { count, points })}
          </div>
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Leaderboard</h2>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px" }}>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-tertiary)", fontSize: 12 }}>No referrals yet. Be the first!</div>
          ) : (
            leaderboard.slice(0, 10).map((entry, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < Math.min(10, leaderboard.length) - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 20, fontSize: 12, fontWeight: 700, color: i < 3 ? "var(--rl-amber)" : "var(--color-text-tertiary)" }}>#{i + 1}</span>
                  <span style={{ fontSize: 13 }}>{entry.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--rl-teal)" }}>{entry.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
