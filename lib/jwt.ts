import { account } from "@/lib/appwrite";

let cache: { jwt: string; expiresAt: number } | null = null;

export async function getJwt(): Promise<string> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.jwt;
  }
  const response = await account.createJWT();
  cache = { jwt: response.jwt, expiresAt: now + 10 * 60 * 1000 };
  return response.jwt;
}
