import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAuth, signInAnonymously, onIdTokenChanged } from "firebase/auth";
import { getFirebaseApp } from "../firebase";

interface UserContextValue {
  apiToken: string | null;
  isReady: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextValue>({
  apiToken: null,
  isReady: false,
  error: null,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);

    // Sign in anonymously to obtain an OIDC token for AppSync
    signInAnonymously(auth).catch((err: Error) => {
      setError(err.message);
      setIsReady(true);
    });

    // Keep token refreshed automatically
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setApiToken(token);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to get token"
          );
        }
      } else {
        setApiToken(null);
      }
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ apiToken, isReady, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
