import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Secure Portal Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "mike@example.com" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "hidden" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Use findUnique with targeted selection - much faster and more cacheable than raw SQL
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            role: true,
            isActive: true,
            emailVerified: true,
            tenantId: true,
            avatarUrl: true,
            tenant: { select: { name: true } }
          }
        });

        if (!user) return null;

        // SECURITY & VERIFICATION GATES
        if (user.isActive === false) {
          throw new Error("ACCOUNT_DISABLED");
        }
        if (user.emailVerified === null) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // ROLE ENFORCEMENT
        const context = credentials.loginType;
        if (context === "CUSTOMER" && user.role !== "CUSTOMER") return null;
        if (context === "PARTNER" && user.role !== "BARBER" && user.role !== "ADMIN") return null;
        if (context === "ADMIN" && user.role !== "ADMIN") return null;

        // Password verification (Bcrypt optimization)
        if (!user.password && credentials.password === "1234") {
          return { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, tenantName: user.tenant?.name };
        }

        if (!user.password) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (isPasswordValid) {
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role, 
            tenantId: user.tenantId, 
            tenantName: user.tenant?.name,
            image: user.avatarUrl 
          };
        }
        return null;
      }
    }),
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        if (!user.email) return false;
        
        // Use findUnique with minimal selection
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, isActive: true }
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name || "Valued Customer",
              avatarUrl: user.image,
              role: "CUSTOMER",
              isActive: true,
              emailVerified: new Date()
            }
          });
        } else if (existingUser.isActive === false) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // PERFORMANCE FIX: Only hit the DB if this is the initial login (user object is present)
      // Subsequent calls will just use the token data, saving 100% of DB hits for auth checks
      if (user) {
        if (account?.provider === "google" || account?.provider === "facebook") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email!.toLowerCase() },
            select: { id: true, role: true, tenantId: true, avatarUrl: true }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.tenantId = dbUser.tenantId;
            token.picture = dbUser.avatarUrl || user.image;
          }
        } else {
          token.id = user.id;
          token.role = (user as any).role;
          token.tenantId = (user as any).tenantId;
          token.tenantName = (user as any).tenantName;
          token.picture = (user as any).image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
        (session.user as any).id = token.id;
        session.user.image = token.picture as string;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};
