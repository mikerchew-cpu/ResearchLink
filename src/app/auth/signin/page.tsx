"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      if (session.user?.role === "admin") router.push("/admin");
      else router.push("/feed");
    }
  }, [session, router]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length < 10) {
      toast.error("Enter a valid Malaysian phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      if (!res.ok) {
        toast.error("Failed to send code");
        return;
      }
      setCodeSent(true);
      toast.success("Code sent via WhatsApp!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (code.length < 4) {
      toast.error("Enter the verification code");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("phone-otp", {
        phone: cleaned,
        code,
        redirect: false,
        callbackUrl: "/feed",
      });
      if (result?.error) {
        toast.error("Invalid code. Try again.");
        return;
      }
      router.push("/feed");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--rl-teal)", marginBottom: 4 }}>ResearchLink</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Malaysia&apos;s Verified Student Research Exchange</div>
        </div>

        <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "0.5px solid var(--color-border-tertiary)", padding: "32px 24px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--rl-teal-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--rl-teal)">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Welcome to ResearchLink</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
              Enter your phone number to receive a verification code via WhatsApp
            </p>
          </div>

          {!codeSent ? (
            <form onSubmit={handleSendCode}>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="60123456789"
                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, fontSize: 16, marginBottom: 12, boxSizing: "border-box", textAlign: "center", color: "#fff", background: "#1a1a1a" }}
              />
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 16, textAlign: "center" }}>
                Your number will be used for survey notifications
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "12px", background: loading ? "#9FE1CB" : "var(--rl-teal)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Sending..." : "Send code via WhatsApp"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12, textAlign: "center" }}>
                Enter the 6-digit code sent to <strong>+{phone.replace(/[^0-9]/g, "")}</strong>
              </p>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, fontSize: 18, marginBottom: 12, textAlign: "center", letterSpacing: 8, boxSizing: "border-box", color: "#fff", background: "#1a1a1a" }}
              />
              <button type="submit" disabled={loading || code.length < 4}
                style={{ width: "100%", padding: "12px", background: loading ? "#9FE1CB" : "var(--rl-teal)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Verifying..." : "Sign in"}
              </button>
              <button type="button" onClick={() => { setCodeSent(false); setCode(""); }}
                style={{ width: "100%", padding: "10px", background: "none", border: "none", fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer", marginTop: 8 }}>
                Use a different number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}