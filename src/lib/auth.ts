import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const CREDENTIALS = {
  username: "rajaShows",
  password: "muneebraja",
};

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "raja-shoes-secret-change-in-prod"
);

const COOKIE_NAME = "raja_session";

export async function createSession(username: string) {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function validateCredentials(username: string, password: string) {
  return (
    username === CREDENTIALS.username && password === CREDENTIALS.password
  );
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { COOKIE_NAME };
