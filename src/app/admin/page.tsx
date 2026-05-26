// src/app/admin/page.tsx
// Admin overview — platform health, revenue summary, quick actions

"use client";
import { useSession } from "next-auth/react";
import { useRouter }  from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";

interface Stats {
  kpis: {
    totalUsers: number; activeSurveys: number; totalResponses: number;
    mrr: number; boostMrr: number; campaignMrr: number;
  };
  charts: {
    revenueByMonth: { month: string; boost: number; campaign: number }[];
    usersByMonth:   { month: string; users: number }[];
    topicDistribution: Record<string, number>;
  };
  tables: {
    topSurveys: { id: string; title: string; response_count: number; is_boosted: boolean; topic_tags: string[] }[];
    universityBreakdown: { university: string; users: number }[];
  };
  pdpa: { consentResearch: number; consentBrand: number; consentRate: number };
}

interface Health {
  total_users: number; new_users_7d: number; active_surveys: number;
  boosted_surveys: number; responses_7d: number;
  boost_revenue_30d: number; campaign_revenue_30d: number;
  pending_moderation: number; pending_reports: number; waitlist_signups: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats,  setStats]  = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      if (session?.user?.role !== "admin") { router.push("/feed"); return; }
      fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => {});
      // Health view from Supabase RPC
      fetch("/api/admin/health").then(r => r.json()).then(setHealth).catch(() => {});
    }
  }, [status, session, router]);

  if (status === "loading" || !stats) {
    return (
      <AppShell user={{}} activePage="admin">
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 60, background: "var(--color-background-secondary)", borderRadius: 10, opacity: 0.6 }} />)}
        </div>
      </AppShell>
    );
  }

  const { kpis, tables, pdpa } = stats;

  const KPI = ({ label, value, sub, color = "#1D9E75" }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 }}>{sub}</div>}
    </div>
  );

  const AlertBadge = ({ count, label, href }: { count: number; label: string; href: string }) => (
    count > 0 ? (
      <Link href={href} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
        background: "#FCEBEB", border: "0.5px solid #E24B4A", borderRadius: 10,
        textDecoration: "none", marginBottom: 8
      }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#E24B4A", color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{count}</div>
        <span style={{ fontSize: 13, color: "#A32D2D", fontWeight: 500 }}>{label}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#A32D2D" }}>Review →</span>
      </Link>
    ) : null
  );

  return (
    <AppShell user={session?.user ?? {}} activePage="admin">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px" }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Admin overview</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            Platform health · {new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Alerts */}
        {health && (health.pending_moderation > 0 || health.pending_reports > 0) && (
          <div style={{ marginBottom: 16 }}>
            <AlertBadge count={health.pending_moderation} label="surveys pending moderation review" href="/admin/moderation" />
            <AlertBadge count={health.pending_reports}    label="community reports awaiting review"  href="/admin/moderation" />
          </div>
        )}

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          <KPI label="Total users"      value={kpis.totalUsers.toLocaleString()}  sub={health ? `+${health.new_users_7d} this week` : ""} />
          <KPI label="Active surveys"   value={kpis.activeSurveys}                sub={health ? `${health.boosted_surveys} boosted` : ""} color="#7F77DD" />
          <KPI label="MRR"              value={`RM ${kpis.mrr.toLocaleString()}`} sub="Boost + campaigns" color="#1D9E75" />
          <KPI label="Total responses"  value={kpis.totalResponses.toLocaleString()} sub={health ? `+${health.responses_7d} this week` : ""} color="#BA7517" />
        </div>

        {/* Revenue split */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <KPI label="Boost revenue (30d)"    value={`RM ${kpis.boostMrr.toLocaleString()}`}    color="#1D9E75" />
          <KPI label="Campaign revenue (30d)" value={`RM ${kpis.campaignMrr.toLocaleString()}`} color="#7F77DD" />
          <KPI label="Waitlist signups"        value={health?.waitlist_signups?.toLocaleString() ?? "—"} sub="Pre-launch" color="#BA7517" />
        </div>

        {/* PDPA health */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>PDPA compliance health</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { label: "Research consent rate", value: `${pdpa.consentRate}%`, color: pdpa.consentRate >= 90 ? "#1D9E75" : "#BA7517" },
              { label: "Research consent",       value: pdpa.consentResearch.toLocaleString(), color: "#1D9E75" },
              { label: "Brand consent",          value: pdpa.consentBrand.toLocaleString(),    color: "#7F77DD" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: "#E1F5EE", borderRadius: 8, fontSize: 11, color: "#0F6E56" }}>
            ✓ Database hosted in Singapore (AWS ap-southeast-1) · ✓ RLS enforced · ✓ DPO appointed · ✓ Consent audit log active
          </div>
        </div>

        {/* Two-column bottom */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* Top surveys */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top surveys by responses</div>
            {tables.topSurveys.slice(0,5).map((s, i) => (
              <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 0", borderBottom: i < 4 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0F6E56", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{s.topic_tags?.[0] ?? "Untagged"} {s.is_boosted ? "· Boosted" : ""}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1D9E75", flexShrink: 0 }}>{s.response_count}</div>
              </div>
            ))}
          </div>

          {/* University breakdown */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Users by university</div>
            {tables.universityBreakdown.slice(0,6).map((u, i) => {
              const max = tables.universityBreakdown[0]?.users ?? 1;
              const pct = Math.round((u.users / max) * 100);
              return (
                <div key={u.university} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{u.university}</span>
                    <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>{u.users.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 5, background: "var(--color-background-tertiary)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#1D9E75", borderRadius: 3, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: 16, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Quick actions</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Review moderation queue",  href: "/admin/moderation", color: "#E24B4A" },
              { label: "Generate Gen-Z report",    href: "/admin/reports",    color: "#7F77DD" },
              { label: "Export platform data",     href: "/api/admin/export?type=platform&format=json", color: "#1D9E75" },
              { label: "View all campaigns",       href: "/admin/campaigns",  color: "#BA7517" },
            ].map(({ label, href, color }) => (
              <Link key={label} href={href}
                style={{ padding: "8px 16px", border: `0.5px solid ${color}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color, textDecoration: "none", background: "transparent" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
