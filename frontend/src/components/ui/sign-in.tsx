import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export const defaultTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://cdn.21st.dev/assets/mirror/9f/9f797e4acee1a4de4f9b4c3aa1cc4e89d7c9efd5dbff1c463d88374ed601d719.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed."
  },
  {
    avatarSrc: "https://cdn.21st.dev/assets/mirror/8d/8d9a61a581c43fe2088f221b7692c95db4b3ad5c0da0c856400c0e5acdcdcea8.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support."
  },
  {
    avatarSrc: "https://cdn.21st.dev/assets/mirror/a6/a634d4f02fe5b77804943c1d74b8d70e35ffe26454e0e9af9717432a2c72bfde.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity."
  },
];

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  onQuickDemo?: (role: 'inspector' | 'fssai' | 'packager') => void;
  errorMessage?: string | null;
  statusMessage?: string | null;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc = "https://cdn.21st.dev/assets/mirror/ec/ecff1664e7fc3185d0e947571f984ea5fa3de9580fb0e73a03cd9c9b3461cb09.jpg",
  testimonials = defaultTestimonials,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  onQuickDemo,
  errorMessage,
  statusMessage,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputName, setInputName] = useState('');

  const handleDemoClick = (role: 'inspector' | 'fssai' | 'packager') => {
    if (role === 'inspector') {
      setInputEmail('inspector.delhi@lmpc.gov.in');
      setInputPassword('Inspector@2026');
    } else if (role === 'fssai') {
      setInputEmail('officer.fssai@gov.in');
      setInputPassword('FSSAI@2026');
    } else {
      setInputEmail('compliance@dabur.com');
      setInputPassword('Packager@2026');
    }
    if (onQuickDemo) {
      onQuickDemo(role);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSignIn) {
      onSignIn(e);
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] bg-background text-foreground selection:bg-violet-500/30 overflow-hidden">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {isRegistering ? <span className="font-light text-foreground tracking-tighter">Create Account</span> : title}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {isRegistering ? "Register your profile to access regulatory and inspection workflows" : description}
            </p>

            {errorMessage && (
              <div className="animate-element p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {statusMessage && (
              <div className="animate-element p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                <span>✅</span>
                <span>{statusMessage}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isRegistering && (
                <div className="animate-element animate-delay-250">
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">Full Name</label>
                  <GlassInputWrapper>
                    <input 
                      name="name" 
                      type="text" 
                      required 
                      value={inputName} 
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="Enter your full name" 
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/60" 
                    />
                  </GlassInputWrapper>
                </div>
              )}

              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">Email Address</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    value={inputEmail} 
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="Enter your email address" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/60" 
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      value={inputPassword} 
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="Enter your password" 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/60" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors p-1">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {!isRegistering && (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="rememberMe" defaultChecked className="custom-checkbox" />
                    <span className="text-foreground/90">Keep me signed in</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-violet-400 transition-colors">Reset password</a>
                </div>
              )}

              <button type="submit" className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-lg active:scale-[0.99]">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </button>

              {/* Subtle 1-Click Fast Fill Pills */}
              <div className="animate-element animate-delay-650 pt-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1 font-medium text-violet-400">⚡ 1-Click Demo Login:</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoClick('inspector')}
                    className="text-xs py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all truncate text-center"
                    title="Sign in as Senior Inspector"
                  >
                    Senior Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoClick('fssai')}
                    className="text-xs py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all truncate text-center"
                    title="Sign in as Food Safety Officer"
                  >
                    FSSAI Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoClick('packager')}
                    className="text-xs py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all truncate text-center"
                    title="Sign in as Packager"
                  >
                    Packager
                  </button>
                </div>
              </div>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center my-1">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
            </div>

            <button onClick={onGoogleSignIn} type="button" className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors cursor-pointer text-foreground">
                <GoogleIcon />
                Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              {isRegistering ? (
                <>
                  Already registered?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); }} className="text-violet-400 hover:underline transition-colors">
                    Sign In
                  </a>
                </>
              ) : (
                <>
                  New to our platform?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); if (onCreateAccount) onCreateAccount(); else setIsRegistering(true); }} className="text-violet-400 hover:underline transition-colors">
                    Create Account
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
