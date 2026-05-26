"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useI18n } from "./I18nProvider";

interface AppShellProps {
  user?: any;
  activePage?: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/feed",      label: "feed",       icon: "🔍" },
  { href: "/post",      label: "post_survey", icon: "📝" },
  { href: "/my-surveys", label: "my_surveys",  icon: "📊" },
  { href: "/rewards",   label: "rewards",     icon: "🎁" },
  { href: "/profile",   label: "profile",     icon: "👤" },
];

export default function AppShell({ user, activePage, children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useI18n();
  const currentUser = session?.user || user;
  const isAdmin = currentUser?.role === "admin";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: 220, background: "var(--color-background-primary)",
        borderRight: "0.5px solid var(--color-border-tertiary)",
        display: "none", flexDirection: "column", padding: "20px 0",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
      }} className="desktop-sidebar">
        <div style={{ padding: "0 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--rl-teal)" }}>ResearchLink</div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>Malaysia</div>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                color: isActive(href) ? "var(--rl-teal)" : "var(--color-text-secondary)",
                background: isActive(href) ? "var(--rl-teal-light)" : "transparent",
                textDecoration: "none",
              }}>
              <span>{icon}</span>
              <span>{t(`nav.${label}`)}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                color: isActive("/admin") ? "var(--rl-teal)" : "var(--color-text-secondary)",
                background: isActive("/admin") ? "var(--rl-teal-light)" : "transparent",
                textDecoration: "none",
              }}>
              <span>⚙️</span>
              <span>{t("nav.admin")}</span>
            </Link>
          )}
        </nav>
        <div style={{ padding: "16px 20px 0", borderTop: "0.5px solid var(--color-border-tertiary)", margin: "0 12px", marginTop: "auto" }}>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", background: "none", border: "none", fontSize: 13, color: "var(--color-text-secondary)", cursor: "pointer", width: "100%" }}>
            <span>🚪</span>
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minHeight: "100dvh" }} className="main-content">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--color-background-primary)",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        padding: "6px 0 calc(6px + env(safe-area-inset-bottom))", zIndex: 50,
      }} className="mobile-bottom-nav">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "6px 12px", fontSize: 10, color: isActive(href) ? "var(--rl-teal)" : "var(--color-text-tertiary)",
                textDecoration: "none",
              }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontWeight: isActive(href) ? 600 : 400 }}>{t(`nav.${label}`)}</span>
            </Link>
          ))}
        </div>
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .main-content { margin-left: 220px; }
        }
        @media (max-width: 767px) {
          .mobile-bottom-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
