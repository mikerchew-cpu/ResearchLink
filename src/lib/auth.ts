import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

function extractUniversity(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain.endsWith(".edu.my")) return domain;
  if (["xmu.edu.my", "um.edu.my", "ukm.edu.my", "upm.edu.my", "usm.edu.my", "utm.edu.my", "uia.edu.my", "monash.edu.my", "nottingham.edu.my", "taylors.edu.my", "sunway.edu.my"].includes(domain)) return domain;
  return null;
}

async function upsertUser(email: string, name: string, image?: string | null) {
  const sb = getSupabase();
  if (!sb) return null;
  const uni = extractUniversity(email) || "university-unknown";
  const { data: existing } = await sb
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (!existing) {
    await sb.from("users").insert({
      email,
      name,
      avatar_url: image,
      university: uni,
      role: "respondent",
      credit_balance: 3,
      points_balance: 0,
      has_consented: false,
    }).maybeSingle();
    const { data: created } = await sb
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    return created;
  }
  return existing;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.token) return null;
        const { email, token } = credentials;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) return null;
        const sb = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await sb.auth.verifyOtp({
          email,
          token,
          type: "email",
        });
        if (error || !data.user) return null;
        const uni = extractUniversity(email);
        if (!uni) return null;
        const user = await upsertUser(email, email.split("@")[0]);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          university: user.university,
          programme: user.programme || "",
          year_of_study: user.year_of_study || "",
          credit_balance: user.credit_balance,
          points_balance: user.points_balance,
          has_consented: user.has_consented,
          telephone_no: user.telephone_no || "",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email!;
        await upsertUser(email, user.name!, user.image);
      }
      return true;
    },
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
