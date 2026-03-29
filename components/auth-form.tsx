"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { getCurrentSession } from "@/lib/auth/session"
import { getDefaultDashboardPath } from "@/lib/dashboard/roles"

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
  const { isLoading, error, handleLogin, handleSignup, clearError } = useAuth()
  const { toast } = useToast()
  
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (activeTab === "login") {
      await handleLogin({
        email: formData.email,
        password: formData.password,
      })
    } else {
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
              <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
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

          <TabsContent value="register" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
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
                <Label htmlFor="register-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
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
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-background border-border focus:border-foreground transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-sm font-medium text-foreground">
                  Date of Birth
                </Label>
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
                <Label htmlFor="register-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
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
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  I want to
                </Label>
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
    </div>
  )
}

/** Role selection toggle button */
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
      <div className={cn(
        "text-sm font-medium",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}>
        {label}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {description}
      </div>
    </button>
  )
}
