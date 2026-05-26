"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

interface Student {
  id: string; name: string; programme: string;
  surveys_posted: number; responses_collected: number;
}

export default function SupervisorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [notifying, setNotifying] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      fetchStudents();
    }
  }, [status, router]);

  async function fetchStudents() {
    try {
      const res = await fetch("/api/supervisor/students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {}
  }

  async function handleNotify(studentId: string) {
    setNotifying(studentId);
    try {
      const res = await fetch("/api/supervisor/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, message: "Reminder: Please check your survey progress." }),
      });
      if (res.ok) toast.success("Notification sent!");
      else toast.error("Failed to send");
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setNotifying(null);
    }
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Supervisor Dashboard</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
          Track your supervisees&apos; FYP survey progress
        </p>

        {students.length === 0 ? (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "32px", textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)" }}>
            No supervisees linked yet. Contact admin to link your students.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {students.map((student) => (
              <div key={student.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{student.programme}</div>
                  </div>
                  <button onClick={() => handleNotify(student.id)} disabled={notifying === student.id}
                    style={{ padding: "6px 12px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    {notifying === student.id ? "..." : "Notify"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--rl-teal)" }}>{student.surveys_posted}</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Surveys</div>
                  </div>
                  <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--rl-purple)" }}>{student.responses_collected}</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Responses</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
