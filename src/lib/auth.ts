import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: string;
      university: string;
      programme: string;
      year_of_study: string;
      credit_balance: number;
      points_balance: number;
      has_consented: boolean;
      telephone_no?: string;
    };
  }
  interface User {
    role: string;
    university: string;
    programme: string;
    year_of_study: string;
    credit_balance: number;
    points_balance: number;
    has_consented: boolean;
    telephone_no?: string;
  }
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null;
        const phone = credentials.phone.replace(/[^0-9]/g, "");
        const code = credentials.code;
        const sb = getSupabase();
        if (!sb) return null;
        const { data: otpRecord } = await sb
          .from("otp_codes")
          .select("*")
          .eq("phone", phone)
          .eq("code", code)
          .eq("used", false)
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!otpRecord) return null;
        await sb.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
        const { data: existing } = await sb
          .from("users")
          .select("*")
          .eq("telephone_no", phone)
          .maybeSingle();
        if (!existing) {
          await sb.from("users").insert({
            email: `${phone}@phone.researchlink.app`,
            name: `User ${phone.slice(-4)}`,
            telephone_no: phone,
            university: "unknown",
            role: "respondent",
            credit_balance: 8,
            points_balance: 0,
            has_consented: false,
          }).maybeSingle();
          const { data: created } = await sb
            .from("users")
            .select("*")
            .eq("telephone_no", phone)
            .maybeSingle();
          if (!created) return null;
          return {
            id: created.id,
            email: created.email,
            name: created.name,
            role: created.role,
            university: created.university,
            programme: created.programme || "",
            year_of_study: created.year_of_study || "",
            credit_balance: created.credit_balance,
            points_balance: created.points_balance,
            has_consented: created.has_consented,
            telephone_no: created.telephone_no || "",
          };
        }
        return {
          id: existing.id,
          email: existing.email,
          name: existing.name,
          role: existing.role,
          university: existing.university,
          programme: existing.programme || "",
          year_of_study: existing.year_of_study || "",
          credit_balance: existing.credit_balance,
          points_balance: existing.points_balance,
          has_consented: existing.has_consented,
          telephone_no: existing.telephone_no || "",
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        const sb = getSupabase();
        if (sb) {
          let { data: user } = await sb
            .from("users")
            .select("*")
            .eq("id", token.sub)
            .maybeSingle();
          if (!user && token.email) {
            const { data: userByEmail } = await sb
              .from("users")
              .select("*")
              .eq("email", token.email)
              .maybeSingle();
            user = userByEmail;
          }
          if (user) {
            session.user = {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatar_url,
              role: user.role,
              university: user.university,
              programme: user.programme || "",
              year_of_study: user.year_of_study || "",
              credit_balance: user.credit_balance,
              points_balance: user.points_balance,
              has_consented: user.has_consented,
              telephone_no: user.telephone_no || "",
            };
          }
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

import { getServerSession } from "next-auth";

export async function auth() {
  return getServerSession(authOptions);
}