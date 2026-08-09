import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { randomUUID } from "crypto";

async function upsertUserMongo(googleId: string, email: string, name: string, image: string) {
  const { getDb } = await import("./db/mongoConnection");
  const db   = await getDb();
  const col  = db.collection<{ _id: string } & Record<string, unknown>>("users");
  const existing = await col.findOne({ googleId });
  if (existing) {
    await col.updateOne({ googleId }, { $set: { email, name, image, updatedAt: new Date() } });
    return existing._id as string;
  }
  const id  = randomUUID();
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col.insertOne({ _id: id, googleId, email, name, image, createdAt: now, updatedAt: now } as any);
  const { MongoPlaybookRepository } = await import("./db/repositories/mongo/playbook");
  await new MongoPlaybookRepository().seed(id);
  return id;
}

async function upsertUserMysql(googleId: string, email: string, name: string, image: string) {
  const { queryOne, execute } = await import("./db/connection");
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM users WHERE google_id = ?",
    [googleId]
  );
  if (existing) {
    await execute(
      "UPDATE users SET email = ?, name = ?, image = ?, updated_at = NOW() WHERE google_id = ?",
      [email, name, image, googleId]
    );
    return existing.id;
  }
  const id  = randomUUID();
  const now = new Date();
  await execute(
    "INSERT INTO users (id, google_id, email, name, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, googleId, email, name, image, now, now]
  );
  const { MysqlPlaybookRepository } = await import("./db/repositories/playbook");
  await new MysqlPlaybookRepository().seed(id);
  return id;
}

// Upsert a user record. For local credentials, googleId is the fixed string "local".
async function upsertUser(googleId: string, email: string, name: string, image: string) {
  return process.env.MONGODB_URI
    ? upsertUserMongo(googleId, email, name, image)
    : upsertUserMysql(googleId, email, name, image);
}

async function getUserIdByGoogleId(googleId: string): Promise<string | undefined> {
  if (process.env.MONGODB_URI) {
    const { getDb } = await import("./db/mongoConnection");
    const db  = await getDb();
    const doc = await db.collection<{ _id: string } & Record<string, unknown>>("users").findOne({ googleId });
    return doc?._id as string | undefined;
  }
  const { queryOne } = await import("./db/connection");
  const row = await queryOne<{ id: string }>("SELECT id FROM users WHERE google_id = ?", [googleId]);
  return row?.id;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Local credentials (works without Google OAuth) ──────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validUser = process.env.LOCAL_USERNAME;
        const validPass = process.env.LOCAL_PASSWORD;

        if (!validUser || !validPass) return null;

        if (
          credentials?.username === validUser &&
          credentials?.password === validPass
        ) {
          // Ensure the local user exists in the DB
          const userId = await upsertUser(
            "local",
            `${validUser}@local`,
            validUser,
            ""
          );
          return { id: userId, name: validUser, email: `${validUser}@local` };
        }
        return null;
      },
    }),

    // ── Google OAuth ────────────────────────────────────────────────────
    // Only active when GOOGLE_CLIENT_ID is set
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  session: {
    strategy:  "jwt",
    maxAge:    30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user, account }) {
      // Credentials: authorize() already returned a valid user object
      if (account?.provider === "credentials") return true;

      // Google: upsert into DB
      if (account?.provider === "google") {
        try {
          await upsertUser(
            account.providerAccountId,
            user.email!,
            user.name!,
            user.image ?? ""
          );
          return true;
        } catch {
          return false;
        }
      }
      return false;
    },

    async jwt({ token, account, user }) {
      if (account?.provider === "credentials" && user) {
        // user.id is already the DB uuid returned from authorize()
        token.userId   = user.id;
        token.googleId = "local";
      }

      if (account?.provider === "google" && user) {
        token.userId   = await getUserIdByGoogleId(account.providerAccountId);
        token.googleId = account.providerAccountId;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id       = token.userId as string;
      session.user.googleId = token.googleId as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id:       string;
      googleId: string;
      name?:    string | null;
      email?:   string | null;
      image?:   string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?:   string;
    googleId?: string;
  }
}
