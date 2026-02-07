import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { autenticacao } from "../firebaseConfig";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(autenticacao, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}