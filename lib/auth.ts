import "server-only";

import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "./supabase";

export async function getUserServer() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    consaole.error("Auth:getUserServer", error);
    return null;
  }

  return user;
}

export async function requireUser(destination = "/login") {
  const user = await getUserServer();
  if (!user) {
    redirect(destination);
  }

  return user;
}
