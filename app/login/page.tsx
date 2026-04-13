import { AuthForm } from "@/components/auth-form"
import { HomeIcon, TreesIcon, MountainIcon } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left Panel - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <Image
          src="/images/rural-house-hero.jpg"
          alt="Beautiful rural countryside cottage surrounded by nature"
          fill
          sizes="(max-width: 1024px) 0vw, 60vw"
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        
        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <HomeIcon className="size-5" />
            </div>
            <span className="font-serif text-2xl tracking-wide">StayHub</span>
          </div>

          {/* Hero Text */}
          <div className="max-w-lg">
            <h1 className="font-serif text-4xl xl:text-5xl leading-tight text-balance">
              Escape to the countryside
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed">
              Discover authentic rural experiences. From charming cottages to historic farmhouses, 
              find your perfect retreat away from the city.
            </p>

            {/* Features */}
            <div className="mt-10 flex gap-8">
              <Feature icon={TreesIcon} label="Rural homes" />
              <Feature icon={MountainIcon} label="Country side" />
            </div>
          </div>
        
          {/* Testimonial */}
        {/*<div className="max-w-md">
            <blockquote className="text-white/90 italic leading-relaxed">
              &ldquo;The most peaceful week of my life. Waking up to birdsong and morning mist 
              over the hills was exactly what I needed.&rdquo;
            </blockquote>
            <div className="mt-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-white/20 backdrop-blur-sm" />
              <div>
                <div className="text-sm font-medium">Sarah Mitchell</div>
                <div className="text-xs text-white/60">London, United Kingdom</div>
              </div>
            </div>
          </div>*/}

          
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-card">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-foreground flex items-center justify-center">
              <HomeIcon className="size-4 text-background" />
            </div>
            <span className="font-serif text-xl tracking-wide">Stay-hub</span>
          </div>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            {/* Welcome Text */}
            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">
                Welcome back
              </h2>
              <p className="mt-3 text-muted-foreground">
                Sign in to discover your next rural escape
              </p>
            </div>

            {/* Auth Form */}
            <AuthForm />

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-muted-foreground">
              By continuing, you acknowledge that you have read and understood our{" "}
              <span className="underline underline-offset-4 hover:text-foreground cursor-pointer transition-colors">
                Terms
              </span>{" "}
              and{" "}
              <span className="underline underline-offset-4 hover:text-foreground cursor-pointer transition-colors">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>

        {/* Bottom decoration - Desktop only */}
        <div className="hidden lg:block p-6 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span> 2026 Stay-Hub. All rights reserved.</span>
            <div className="flex gap-6">
              <span className="hover:text-foreground cursor-pointer transition-colors">Help</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function Feature({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-5 text-white/70" />
      <span className="text-sm text-white/80">{label}</span>
    </div>
  )
}
