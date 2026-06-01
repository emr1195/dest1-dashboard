import { consumeAccessCode, verifyAccessCode } from "./accessCodes";
import { cookies } from "next/headers";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { verifyPassword } from "./password";
import { AppRole, isAppRole } from "./roles";

export type UserRole = AppRole;

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const resolveUserAccess = async (email?: string | null) => {
  if (!email) return null;

  const normalizedEmail = email.toLowerCase();

  const authUser = await prisma.authUser.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, role: true, name: true },
  });
  if (authUser && isAppRole(authUser.role)) {
    return { id: authUser.id, role: authUser.role, name: authUser.name };
  }

  if (adminEmails.includes(normalizedEmail)) {
    const admin = await prisma.admin.findFirst();
    return { id: admin?.id || normalizedEmail, role: "admin" as UserRole };
  }

  const Lider = await prisma.lider.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, surname: true },
  });
  if (Lider) return { id: Lider.id, role: "teacher" as UserRole, name: Lider.name + " " + Lider.surname };

  const Muchacho = await prisma.muchacho.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, surname: true },
  });
  if (Muchacho) return { id: Muchacho.id, role: "student" as UserRole, name: Muchacho.name + " " + Muchacho.surname };

  const parent = await prisma.parent.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, surname: true },
  });
  if (parent) return { id: parent.id, role: "parent" as UserRole, name: parent.name + " " + parent.surname };

  return null;
};

const createGoogleUserWithPendingCode = async (email: string, name?: string | null) => {
  const cookieStore = cookies();
  const pendingRole = cookieStore.get("pending_google_role")?.value;
  const pendingCode = cookieStore.get("pending_google_code")?.value;

  if (!isAppRole(pendingRole) || !pendingCode) return null;

  const accessCode = await verifyAccessCode({ email, role: pendingRole, code: pendingCode });
  if (!accessCode) return null;

  const authUser = await prisma.authUser.create({
    data: {
      email,
      name: name || email,
      provider: "google",
      role: pendingRole,
    },
  });

  await consumeAccessCode(accessCode.id);

  return { id: authUser.id, role: authUser.role as UserRole, name: authUser.name };
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Correo y contrasena",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const authUser = await prisma.authUser.findUnique({ where: { email } });
        if (!authUser?.passwordHash || !isAppRole(authUser.role)) return null;

        const isValidPassword = verifyPassword(password, authUser.passwordHash);
        if (!isValidPassword) return null;

        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name || authUser.email,
          role: authUser.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const existingAccess = await resolveUserAccess(email);
      if (existingAccess) return true;

      const createdUser = await createGoogleUserWithPendingCode(email, user.name);
      return Boolean(createdUser);
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.userId = user.id;
        token.role = (user as { role?: UserRole }).role;
      }

      if (account?.provider === "google" && token.email) {
        const access = await resolveUserAccess(token.email);
        token.userId = access?.id;
        token.role = access?.role;
        token.name = access?.name || token.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string | undefined;
        session.user.role = token.role as UserRole | undefined;
        session.user.name = (token.name as string | undefined) || session.user.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.user.role || !session.user.id) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role,
  };
};


