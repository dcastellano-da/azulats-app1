import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./config";

export function setTokenCookie(token: string) {
  if (typeof window === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000);
  document.cookie = `azul_ats_token=${token}; expires=${d.toUTCString()}; path=/; SameSite=Lax; Secure`;
}

export function clearTokenCookie() {
  if (typeof window === "undefined") return;
  document.cookie = "azul_ats_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
}

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error(
      "Firebase Client Auth no está inicializado. Por favor, asegúrate de configurar las variables de entorno NEXT_PUBLIC_FIREBASE en tu archivo .env.local y reinicia el servidor. Si estás haciendo pruebas de UI, puedes usar la pestaña 'Panel Demo' en la pantalla de login."
    );
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    setTokenCookie(token);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function loginWithGoogle() {
  return signInWithGoogle();
}

export async function loginWithEmail(email: string, password: string) {
  if (!auth) {
    throw new Error(
      "Firebase Client Auth no está inicializado. Por favor, asegúrate de configurar las variables de entorno NEXT_PUBLIC_FIREBASE en tu archivo .env.local y reinicia el servidor."
    );
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  const token = await result.user.getIdToken();
  setTokenCookie(token);
  return result.user;
}

export async function signOutUser() {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Firebase signout warning:", e);
    }
  }
  clearTokenCookie();
}

/**
 * Returns security token (JWT) of current authenticated Firebase user.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined" || !auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(true); // force refresh to ensure validity
  } catch (error) {
    console.error("Error getting user ID Token:", error);
    return null;
  }
}
