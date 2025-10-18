"use client";

import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function Loginforma() {
  const supabase = createClientComponentClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Auth
      supabaseClient={supabase}
      view="sign_in"
      providers={["google"]}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: "#7c3aed",
              brandAccent: "#5b21b6",
              inputBackground: "rgba(15,23,42,0.8)",
              inputText: "#fff",
            },
          },
        },
      }}
      redirectTo={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`}
      showLinks={false}
      localization={{
        variables: {
          sign_in: {
            email_label: "E-mail",
            password_label: "Senha",
            button_label: "Entrar",
          },
        },
      }}
    />
  );
}
