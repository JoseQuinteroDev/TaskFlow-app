import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, CheckSquare } from "lucide-react";

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const [name, setName] = useState("");
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

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsSubmitting(false);
      return;
    }

    const result = await register(email, password, name);
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
            Crea tu cuenta
          </h1>
          <p className="text-zinc-400 mb-8">
            Comienza a organizar tus tareas de forma eficiente
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm" data-testid="register-error">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                disabled={isSubmitting}
                className="bg-[#18181B] border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-50 focus:ring-zinc-50"
                data-testid="register-name-input"
              />
            </div>

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
                data-testid="register-email-input"
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
                data-testid="register-password-input"
              />
              <p className="text-xs text-zinc-500">Mínimo 6 caracteres</p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-medium"
              data-testid="register-submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>

          <p className="text-center mt-8 text-zinc-400">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="text-zinc-50 hover:underline" data-testid="login-link">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
