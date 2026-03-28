import { useContext } from "react";
import { UserContext } from "./UserContextDef";

export function useUser() {
  return useContext(UserContext);
}
