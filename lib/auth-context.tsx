"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Models } from "appwrite";
import { account } from "@/lib/appwrite";

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  mfaRequired: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  mfaRequired: false,
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const u = await account.get();
      setUser(u);
      setMfaRequired(false);
    } catch (err: unknown) {
      setUser(null);
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        "type" in err &&
        (err as { code: number }).code === 401 &&
        (err as { type: string }).type === "user_more_factors_required"
      ) {
        setMfaRequired(true);
      } else {
        setMfaRequired(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, mfaRequired, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
