import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export function setupPassport() {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id));

          if (existingUser) {
            return done(null, existingUser);
          }

          const [newUser] = await db
            .insert(users)
            .values({
              googleId: profile.id,
              email: profile.emails?.[0]?.value || "",
              name: profile.displayName || "",
              picture: profile.photos?.[0]?.value || null,
            })
            .returning();

          return done(null, newUser);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
}

export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

