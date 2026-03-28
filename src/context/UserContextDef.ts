import { createContext } from "react";

export interface UserContextValue {
  apiToken: string | null;
  isReady: boolean;
  error: string | null;
}

export const UserContext = createContext<UserContextValue>({
  apiToken: null,
  isReady: false,
  error: null,
});
