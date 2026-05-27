"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

export default function ImportPhonesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number; detail?: any } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated" && session?.user?.role !== "admin") { router.push("/feed"); return; }
  }, [status, session, router]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Select a CSV file"); return; }

    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/import-phones", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Import failed"); return; }
      setResult(data);
      toast.success(`Imported ${data.imported} phones`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return (
    <AppShell user={{}} activePage="admin">
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px", textAlign: "center", paddingTop: 40, fontSize: 13, color: "var(--color-text-tertiary)" }}>Loading...</div>
    </AppShell>
  );

  return (
    <AppShell user={session?.user ?? {}} activePage="admin">
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Import Phone Numbers</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
          Upload a CSV file with a <strong>phone</strong> column to bulk register users
        </p>

        <form onSubmit={handleUpload} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "24px" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ marginBottom: 16, fontSize: 13, color: "var(--color-text-primary)" }}
          />
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 16 }}>
            CSV format: first row must have a "phone" column. Example:<br />
            <code style={{ background: "var(--color-background-secondary)", padding: "2px 6px", borderRadius: 4 }}>phone<br />60123456789<br />60139876543</code>
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: "10px 24px", background: loading ? "#9FE1CB" : "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Importing..." : "Import"}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: 20, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Result</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <span style={{ color: "var(--rl-teal)", fontWeight: 600 }}>{result.imported}</span> imported<br />
              <span style={{ color: "var(--rl-amber)", fontWeight: 600 }}>{result.skipped}</span> skipped<br />
              {result.errors > 0 && <span style={{ color: "var(--rl-coral)", fontWeight: 600 }}>{result.errors}</span>}
              {result.errors > 0 && " errors"}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
