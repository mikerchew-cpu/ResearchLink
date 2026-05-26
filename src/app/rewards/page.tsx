"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";

interface VoucherRate {
  id: string; brand: string; rm_value: number; points_required: number;
}

interface RewardTxn {
  id: string; type: string; points: number; description: string; created_at: string;
}

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [vouchers, setVouchers] = useState<VoucherRate[]>([]);
  const [history, setHistory] = useState<RewardTxn[]>([]);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      fetch("/api/voucher").then(r => r.json()).then(d => setVouchers(d.rates || [])).catch(() => {});
      fetch("/api/profile/rewards").then(r => r.json()).then(d => setHistory(d.transactions || [])).catch(() => {});
    }
  }, [status, router]);

  async function handleRedeem(voucherId: string) {
    setRedeeming(voucherId);
    try {
      const res = await fetch("/api/voucher/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucher_pool_id: voucherId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCode(data.code);
        toast.success(t("rewards.redeem_success", { code: data.code }));
      } else {
        toast.error(data.error || t("errors.general"));
      }
    } catch {
      toast.error(t("errors.general"));
    } finally {
      setRedeeming(null);
    }
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="rewards">
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{t("rewards.title")}</h1>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--rl-teal)", marginBottom: 20 }}>
          {t("rewards.points_balance", { points: session?.user?.points_balance || 0 })}
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{t("rewards.redeem_subtitle")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}>
          {vouchers.map((v) => (
            <div key={v.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{v.brand}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--rl-teal)", marginBottom: 2 }}>RM {v.rm_value.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 10 }}>{v.points_required} points</div>
              <button onClick={() => handleRedeem(v.id)} disabled={redeeming === v.id || (session?.user?.points_balance || 0) < v.points_required}
                style={{ width: "100%", padding: "8px", background: (session?.user?.points_balance || 0) >= v.points_required ? "var(--rl-teal)" : "var(--color-border-tertiary)", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: (session?.user?.points_balance || 0) >= v.points_required ? "pointer" : "not-allowed" }}>
                {redeeming === v.id ? "..." : t("rewards.voucher_redeem_btn")}
              </button>
            </div>
          ))}
        </div>

        {code && (
          <div style={{ background: "var(--rl-teal-light)", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--rl-teal-dark)", marginBottom: 4 }}>Your voucher code</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--rl-teal-dark)", letterSpacing: 2 }}>{code}</div>
          </div>
        )}

        <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{t("rewards.history_title")}</h2>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-tertiary)", fontSize: 12 }}>No transactions yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((txn) => (
              <div key={txn.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-background-primary)", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)" }}>
                <div>
                  <div style={{ fontSize: 12 }}>{txn.description}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{new Date(txn.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: txn.type === "earn" ? "var(--rl-teal)" : "var(--rl-coral)" }}>
                  {txn.type === "earn" ? "+" : "-"}{txn.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
