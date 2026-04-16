"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, CheckCircle2, Circle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { getCurrentSession } from "@/lib/auth/session"
import { getDefaultDashboardPath } from "@/lib/dashboard/roles"

// ---------------------------------------------------------------------------
// Password regex — matches backend DTOs exactly
// ---------------------------------------------------------------------------

// UserSignupRequestDTO: ^(?=.*[A-Z])(?=.*\d).{8,}$
const SIGNUP_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

// ResetPasswordRequestDTO: ^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$
const RESET_PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/

// ---------------------------------------------------------------------------
// Password requirements hint
// ---------------------------------------------------------------------------

type PasswordPattern = "signup" | "reset"

interface RequirementCheck {
  label: string
  ok: boolean
}

function getChecks(password: string, pattern: PasswordPattern): RequirementCheck[] {
  if (pattern === "signup") {
    return [
      { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
      { label: "1 letra mayúscula", ok: /[A-Z]/.test(password) },
      { label: "1 número", ok: /\d/.test(password) },
    ]
  }
  return [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "1 letra mayúscula", ok: /[A-Z]/.test(password) },
    { label: "1 letra minúscula", ok: /[a-z]/.test(password) },
    { label: "1 número", ok: /[0-9]/.test(password) },
    { label: "1 carácter especial (@#$%^&+=!)", ok: /[@#$%^&+=!]/.test(password) },
    { label: "Sin espacios", ok: /^\S+$/.test(password) },
  ]
}

function PasswordHint({ password, pattern }: { password: string; pattern: PasswordPattern }) {
  if (!password) return null
  const checks = getChecks(password, pattern)
  return (
    <ul className="mt-1.5 space-y-0.5">
      {checks.map(({ label, ok }) => (
        <li
          key={label}
          className={cn(
            "text-xs flex items-center gap-1.5 transition-colors",
            ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}
        >
          {ok
            ? <CheckCircle2 className="size-3 shrink-0" />
            : <Circle className="size-3 shrink-0" />}
          {label}
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Countdown hook — 15 min expiration for recovery code
// ---------------------------------------------------------------------------

function useCountdown(expiresAt: number | null) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null)
      setExpired(false)
      return
    }

    const tick = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        setTimeLeft("00:00")
        setExpired(true)
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`)
      setExpired(false)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return { timeLeft, expired }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface FormData {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  birthDate: string
  profilePicture: string
  roles: string[]
}

export function AuthForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const { isLoading, error, handleLogin, handleSignup, handleForgotPassword, handleResetPassword, clearError } = useAuth()
  const { toast } = useToast()

  // Forgot/reset password dialog state
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<"email" | "code">("email")
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotCode, setForgotCode] = useState("")
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  const { timeLeft, expired } = useCountdown(expiresAt)

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    birthDate: "",
    profilePicture: "",
    roles: ["GUEST"]
  })

  useEffect(() => {
    const session = getCurrentSession()
    if (session) {
      router.replace(getDefaultDashboardPath(session.roles))
    }
  }, [router])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleRoleToggle = useCallback((role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    clearError()
  }, [clearError])

  const openForgotDialog = useCallback(() => {
    setForgotStep("email")
    setForgotEmail(formData.email)
    setForgotCode("")
    setForgotNewPassword("")
    setForgotError(null)
    setExpiresAt(null)
    setForgotOpen(true)
  }, [formData.email])

  const handleForgotSubmitEmail = useCallback(async () => {
    if (!forgotEmail) {
      setForgotError("Ingresá tu email")
      return
    }
    setForgotLoading(true)
    setForgotError(null)
    const ok = await handleForgotPassword({ email: forgotEmail })
    setForgotLoading(false)
    if (!ok) {
      setForgotError("No se pudo enviar el código. Verificá el email.")
      return
    }
    setExpiresAt(Date.now() + 15 * 60 * 1000)
    setForgotStep("code")
  }, [forgotEmail, handleForgotPassword])

  const handleForgotSubmitReset = useCallback(async () => {
    if (!forgotCode || !forgotNewPassword) {
      setForgotError("Completá todos los campos")
      return
    }
    if (forgotCode.length !== 6 || !/^\d{6}$/.test(forgotCode)) {
      setForgotError("El código debe ser de 6 dígitos numéricos")
      return
    }
    if (!RESET_PASSWORD_REGEX.test(forgotNewPassword)) {
      setForgotError("La contraseña no cumple con los requisitos de seguridad")
      return
    }
    if (expired) {
      setForgotError("El código expiró. Solicitá uno nuevo.")
      return
    }
    setForgotLoading(true)
    setForgotError(null)
    const ok = await handleResetPassword({ email: forgotEmail, code: forgotCode, newPassword: forgotNewPassword })
    setForgotLoading(false)
    if (!ok) {
      setForgotError("Código inválido o expirado. Intentá de nuevo.")
      return
    }
    setForgotOpen(false)
    toast({ title: "Contraseña restablecida", description: "Ya podés iniciar sesión con tu nueva contraseña." })
  }, [forgotCode, forgotNewPassword, forgotEmail, handleResetPassword, toast, expired])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (activeTab === "login") {
      await handleLogin({
        email: formData.email,
        password: formData.password,
      })
    } else {
      if (!SIGNUP_PASSWORD_REGEX.test(formData.password)) {
        toast({
          title: "Contraseña inválida",
          description: "Debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.",
          variant: "destructive",
        })
        return
      }
      const success = await handleSignup({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate,
        profilePicture: formData.profilePicture || undefined,
        roles: formData.roles,
      })

      if (success) {
        toast({
          title: "Account created",
          description: "You can now sign in with your credentials.",
        })
        setActiveTab("login")
        setFormData(prev => ({ ...prev, password: "" }))
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 h-12">
          <TabsTrigger
            value="login"
            className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
          >
            Sign In
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
          >
            Create Account
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="mt-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Login */}
          <TabsContent value="login" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox id="remember" className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button
                type="button"
                onClick={openForgotDialog}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm tracking-wide"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm font-medium text-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-sm font-medium text-foreground">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <PasswordHint password={formData.password} pattern="signup" />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">I want to</Label>
                <div className="flex gap-4">
                  <RoleToggle
                    label="Book stays"
                    description="Find rural escapes"
                    isActive={formData.roles.includes("GUEST")}
                    onClick={() => handleRoleToggle("GUEST")}
                  />
                  <RoleToggle
                    label="Host guests"
                    description="List your property"
                    isActive={formData.roles.includes("HOST")}
                    onClick={() => handleRoleToggle("HOST")}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="terms" className="mt-0.5 border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" required />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I agree to the{" "}
                <span className="text-foreground hover:underline underline-offset-4 cursor-pointer">Terms of Service</span>
                {" "}and{" "}
                <span className="text-foreground hover:underline underline-offset-4 cursor-pointer">Privacy Policy</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium text-sm tracking-wide"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </TabsContent>
        </form>
      </Tabs>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={(open) => {
        setForgotOpen(open)
        if (!open) setExpiresAt(null)
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {forgotStep === "email" ? "Recuperar contraseña" : "Ingresar código"}
            </DialogTitle>
            <DialogDescription>
              {forgotStep === "email"
                ? "Te enviaremos un código de recuperación a tu email."
                : "Revisá tu bandeja de entrada e ingresá el código de 6 dígitos recibido."}
            </DialogDescription>
          </DialogHeader>

          {forgotError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <XCircle className="size-4 shrink-0" />
              {forgotError}
            </div>
          )}

          {forgotStep === "email" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <Button className="w-full h-11" onClick={handleForgotSubmitEmail} disabled={forgotLoading}>
                {forgotLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : "Enviar código"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Countdown */}
              {timeLeft && (
                <div className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                  expired
                    ? "border-destructive/40 bg-destructive/5 text-destructive"
                    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                )}>
                  <span>{expired ? "Código expirado" : "Código válido por"}</span>
                  {!expired && <span className="font-mono font-semibold">{timeLeft}</span>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="forgot-code">Código de recuperación</Label>
                <Input
                  id="forgot-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-11 tracking-widest text-center font-mono text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forgot-new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="forgot-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <PasswordHint password={forgotNewPassword} pattern="reset" />
              </div>

              <Button
                className="w-full h-11"
                onClick={handleForgotSubmitReset}
                disabled={forgotLoading || expired}
              >
                {forgotLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : "Restablecer contraseña"}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setForgotStep("email")
                  setExpiresAt(null)
                  setForgotCode("")
                  setForgotNewPassword("")
                  setForgotError(null)
                }}
              >
                Volver a ingresar email
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RoleToggle({
  label,
  description,
  isActive,
  onClick
}: {
  label: string
  description: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 p-4 rounded-lg border-2 text-left transition-all duration-200",
        isActive
          ? "border-foreground bg-foreground/5"
          : "border-border hover:border-muted-foreground/50"
      )}
    >
      <div className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
    </button>
  )
}
