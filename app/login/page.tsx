import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loginforma } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brasa-navy via-background to-background px-4 py-16">
      <Card className="w-full max-w-lg rounded-3xl border-border/30 bg-background/80 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="font-display text-3xl font-bold">Acesse sua conta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Entre com e-mail ou Google para continuar criando com a Brasa Forge.
          </p>
        </CardHeader>
        <CardContent>
          <Loginforma />
        </CardContent>
      </Card>
    </div>
  );
}
