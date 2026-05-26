// src/app/admin/reports/page.tsx
// Admin: Gen-Z trend report generation and publishing

"use client";
import { useSession } from "next-auth/react";
import { useRouter }  from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

interface ReportTemplate {
  id: string; title: string; description: string;
  price_myr: number; category: string; pages: number;
}

interface PublishedReport {
  id: string; title: string; price_myr: number;
  is_published: boolean; generated_at: string;
  purchase_count: number;
}

const TEMPLATES: ReportTemplate[] = [
  { id: "genz-financial-2025", title: "Malaysian Gen-Z Financial Behaviour 2025",     price_myr: 3800, category: "Fintech",     pages: 28, description: "Digital banking, BNPL sentiment, TNG vs GrabPay preference among 1,200+ verified students." },
  { id: "campus-brand-fb-2025", title: "Campus Brand Perception Report: F&B Sector",  price_myr: 2800, category: "F&B",         pages: 22, description: "ZUS vs Tealive vs Gong Cha, spending patterns across Klang Valley universities." },
  { id: "ev-adoption-2025",    title: "EV Adoption Readiness Among Malaysian Students", price_myr: 2500, category: "Automotive", pages: 18, description: "Purchase intent, brand awareness, sustainability attitudes." },
];

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [published, setPublished] = useState<PublishedReport[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated,  setGenerated]  = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated" && session?.user?.role !== "admin") { router.push("/feed"); return; }
    fetch("/api/report/list").then(r => r.json()).then(d => setPublished(d.published ?? [])).catch(() => {});
  }, [status, session, router]);

  async function generate() {
    setGenerating(selectedTemplate);
    const res = await fetch("/api/report/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId:  selectedTemplate,
        customTitle: customTitle || undefined,
        dateFrom:    new Date(Date.now() - 90 * 86400000).toISOString(),
      }),
    });
    const data = await res.json();
    setGenerating(null);
    if (res.ok) {
      setGenerated(data.report_id);
      // Refresh published list
      fetch("/api/report/list").then(r => r.json()).then(d => setPublished(d.published ?? [])).catch(() => {});
    }
  }

  async function togglePublish(reportId: string, isPublished: boolean) {
    setPublishing(reportId);
    await fetch(`/api/admin/reports/${reportId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publish: !isPublished }),
    }).catch(() => {});
    setPublished(p => p.map(r => r.id === reportId ? { ...r, is_published: !isPublished } : r));
    setPublishing(null);
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="admin">
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Gen-Z trend reports</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            Generate AI-powered research reports from anonymised platform data
          </p>
        </div>

        {/* Generator */}
        <div style={{ background: "white", border: "0.5px solid #D3D1C7", borderRadius: 14, padding: "20px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Generate new report</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Report template</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  style={{ padding: "12px 14px", border: `${selectedTemplate === t.id ? "2px solid #1D9E75" : "0.5px solid #D3D1C7"}`, borderRadius: 10, cursor: "pointer", background: selectedTemplate === t.id ? "#E1F5EE" : "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{t.title}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1D9E75" }}>RM {t.price_myr.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#5F5E5A" }}>{t.description}</div>
                  <div style={{ fontSize: 10, color: "#888780", marginTop: 4 }}>{t.category} · ~{t.pages} pages</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Custom title (optional)</label>
            <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
              placeholder="Leave blank to use template title"
              style={{ width: "100%", padding: "9px 12px", border: "0.5px solid #D3D1C7", borderRadius: 9, fontSize: 13, outline: "none" }} />
          </div>

          {generated && (
            <div style={{ background: "#E1F5EE", borderRadius: 9, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#0F6E56" }}>
              ✓ Report generated successfully. Review it below and publish when ready.
            </div>
          )}

          <button onClick={generate} disabled={!!generating}
            style={{ padding: "11px 24px", background: generating ? "#9FE1CB" : "#1D9E75", color: "white", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {generating ? (
              <>
                <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Generating report (takes ~20s)…
              </>
            ) : "Generate report with AI"}
          </button>
          <div style={{ marginTop: 8, fontSize: 11, color: "#888780" }}>
            Uses GPT-4o to generate narrative insights from the last 90 days of anonymised platform data. PDF rendered automatically.
          </div>
        </div>

        {/* Published reports */}
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Published reports</div>
        {published.length === 0 ? (
          <div style={{ background: "white", border: "0.5px solid #D3D1C7", borderRadius: 12, padding: "32px", textAlign: "center", fontSize: 13, color: "#888780" }}>
            No reports generated yet. Use the form above to create your first report.
          </div>
        ) : published.map(r => (
          <div key={r.id} style={{ background: "white", border: "0.5px solid #D3D1C7", borderRadius: 12, padding: "16px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "#888780" }}>
                RM {r.price_myr.toLocaleString()} · Generated {new Date(r.generated_at).toLocaleDateString("en-MY")} · {r.purchase_count} purchases
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: r.is_published ? "#E1F5EE" : "#F1EFE8", color: r.is_published ? "#0F6E56" : "#5F5E5A" }}>
                {r.is_published ? "Published" : "Draft"}
              </span>
              <button onClick={() => togglePublish(r.id, r.is_published)} disabled={publishing === r.id}
                style={{ padding: "6px 14px", background: r.is_published ? "#F1EFE8" : "#1D9E75", color: r.is_published ? "#5F5E5A" : "white", border: "0.5px solid #D3D1C7", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {publishing === r.id ? "…" : r.is_published ? "Unpublish" : "Publish for sale"}
              </button>
            </div>
          </div>
        ))}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );
}
