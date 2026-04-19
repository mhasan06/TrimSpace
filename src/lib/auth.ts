import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

        // Use Raw SQL for absolute accuracy and to bypass Prisma type-sync issues
        const users = await prisma.$queryRawUnsafe<any[]>(
          `SELECT u.*, t.name as "tenantName" 
           FROM "User" u 
           LEFT JOIN "Tenant" t ON u."tenantId" = t.id 
           WHERE u.email = $1 LIMIT 1`,
          credentials.email
        );

        if (users.length === 0) return null;
        const user = users[0];

        // SECURITY CHECK: Block disabled accounts
        if (user.isActive === false) {
          throw new Error("ACCOUNT_DISABLED: This account has been deactivated by an administrator.");
        }

        // ROLE ENFORCEMENT: Strictly gate based on the portal context
        const context = credentials.loginType;
        if (context === "CUSTOMER" && user.role !== "CUSTOMER") return null;
        if (context === "PARTNER" && user.role !== "BARBER" && user.role !== "ADMIN") return null;
        if (context === "ADMIN" && user.role !== "ADMIN") return null;

        // Password verification (Legacy Mock bypassing + Hashed support)
        if (!user.password && credentials.password === "1234") {
          return { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, tenantName: user.tenantName };
        }

        if (!user.password) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password as string);
        if (isPasswordValid) {
          return { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, tenantName: user.tenantName };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // SECURITY KICK-OUT: Force immediate revocation if account is disabled in DB
        const statusRows = await prisma.$queryRawUnsafe<any[]>(
           `SELECT "isActive" FROM "User" WHERE id = $1 LIMIT 1`,
           token.id
        );
        
        if (statusRows.length === 0 || statusRows[0].isActive === false) {
            // Force sign-out by returning invalid session
            return null as any; 
        }

        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" }
};
