"use client";
import { supabase } from "@/lib/supabase";

export default function AuthButton({ user }: any) {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return user ? (
    <button onClick={signOut} className="btn">Logout</button>
  ) : (
    <button onClick={signIn} className="btn">Login with Google</button>
  );
}
