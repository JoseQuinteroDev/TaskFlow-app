import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, CheckSquare } from "lucide-react";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-container">
      {/* Left side - Image */}
      <div
        className="auth-image"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1761998066478-821bf52c2849?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBtaW5pbWFsaXN0JTIwZ2VvbWV0cmljJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzQ4ODEzODZ8MA&ixlib=rb-4.1.0&q=85')`,
          backgroundColor: "#09090B",
        }}
      />

      {/* Right side - Form */}
      <div className="auth-form bg-[#09090B]">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <CheckSquare className="w-8 h-8 text-zinc-50" />
            <span className="text-2xl font-bold text-zinc-50 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              TaskFlow
            </span>
          </div>

          <h1 className="text-3xl font-bold text-zinc-50 mb-2 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Bienvenido de nuevo
          </h1>
          <p className="text-zinc-400 mb-8">
            Ingresa tus credenciales para acceder a tu cuenta
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm" data-testid="login-error">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isSubmitting}
                className="bg-[#18181B] border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-50 focus:ring-zinc-50"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className="bg-[#18181B] border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-50 focus:ring-zinc-50"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-medium"
              data-testid="login-submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          <p className="text-center mt-8 text-zinc-400">
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="text-zinc-50 hover:underline" data-testid="register-link">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
