import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">CifraCash</h1>
        <p className="mt-2 text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
