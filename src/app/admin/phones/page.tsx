"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

interface PhoneUser {
  id: string; name: string; email: string; telephone_no: string;
  role: string; university: string; credit_balance: number; created_at: string;
}

export default function PhonesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<PhoneUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated" && session?.user?.role !== "admin") { router.push("/feed"); return; }
  }, [status, session, router]);

  const fetchPhones = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/phones?${params}`);
      const data = await res.json();
      if (res.ok) { setUsers(data.data); setTotal(data.total); }
    } catch {} finally { setLoading(false); }
  }, [page, query]);

  useEffect(() => { if (status === "authenticated" && session?.user?.role === "admin") fetchPhones(); }, [status, session, fetchPhones]);

  async function removePhone(id: string) {
    if (!confirm("Remove phone number from this user?")) return;
    setRemoving(id);
    try {
      const res = await fetch("/api/admin/phones", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { toast.success("Phone removed"); fetchPhones(); }
      else toast.error("Failed to remove");
    } catch { toast.error("Failed to remove"); }
    finally { setRemoving(null); }
  }

  const totalPages = Math.ceil(total / limit);

  if (status === "loading") return (
    <AppShell user={{}} activePage="admin">
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 80px", textAlign: "center", paddingTop: 40, fontSize: 13, color: "var(--color-text-tertiary)" }}>Loading...</div>
    </AppShell>
  );

  return (
    <AppShell user={session?.user ?? {}} activePage="admin">
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Phone Numbers</h1>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>{total} registered phone numbers</p>
          </div>
          <a href="/admin/import-phones" style={{ padding: "8px 16px", background: "var(--rl-teal)", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>+ Import CSV</a>
        </div>

        <input type="text" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search by phone, name or email..."
          style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, color: "var(--color-text-primary)", marginBottom: 16, boxSizing: "border-box" }} />

        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 0.8fr 60px", gap: 8, padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <span>Name</span><span>Phone</span><span>University</span><span></span>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)" }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)" }}>No phone numbers found</div>
          ) : users.map(u => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 0.8fr 60px", gap: 8, padding: "10px 14px", fontSize: 13, borderBottom: "0.5px solid var(--color-border-tertiary)", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{u.role}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{u.telephone_no}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{u.university || "—"}</div>
              <button onClick={() => removePhone(u.id)} disabled={removing === u.id}
                style={{ padding: "4px 8px", background: "none", border: "0.5px solid var(--rl-coral)", borderRadius: 6, fontSize: 11, color: "var(--rl-coral)", cursor: "pointer" }}>
                {removing === u.id ? "..." : "Remove"}
              </button>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, fontSize: 13 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "var(--color-background-primary)", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <span style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "6px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "var(--color-background-primary)", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
