import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignIn?: (credentials: { email: string; password: string }) => void;
  onResetPassword?: () => void;
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

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  onSignIn,
  onResetPassword,
  onQuickDemo,
  errorMessage,
  statusMessage,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');

  const handleDemoClick = (role: 'inspector' | 'fssai' | 'packager') => {
    let email = 'inspector.delhi@lmpc.gov.in';
    let pass = 'Inspector@2026';
    if (role === 'fssai') {
      email = 'officer.fssai@gov.in';
      pass = 'FSSAI@2026';
    } else if (role === 'packager') {
      email = 'compliance@dabur.com';
      pass = 'Packager@2026';
    }
    setInputEmail(email);
    setInputPassword(pass);
    if (onQuickDemo) {
      onQuickDemo(role);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignIn) {
      onSignIn({ email: inputEmail, password: inputPassword });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-background text-foreground selection:bg-violet-500/30 overflow-y-auto">
      {/* Centered Sign-In Card without side hero or external items */}
      <div className="w-full max-w-md bg-[#121215] border border-border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl my-auto">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header */}
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {description}
            </p>
          </div>

          {/* Prominent Test Login / 1-Click Demo Bar */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-950/40 via-purple-900/25 to-indigo-950/40 border border-violet-500/30 p-3.5 shadow-md">
            <div className="flex items-center justify-between text-xs font-semibold text-violet-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span>Test Login / Demo Bar</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">Click any role to test</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoClick('inspector')}
                className="py-2 px-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-400/30 text-xs font-medium text-violet-200 transition-all text-center cursor-pointer active:scale-95 shadow-sm truncate"
                title="Login as Senior Inspector Sh. Rajeshwar Singh"
              >
                Senior Inspector
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('fssai')}
                className="py-2 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-400/30 text-xs font-medium text-emerald-200 transition-all text-center cursor-pointer active:scale-95 shadow-sm truncate"
                title="Login as Food Safety Officer Dr. Sunita Deshmukh"
              >
                FSSAI Officer
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('packager')}
                className="py-2 px-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 border border-amber-400/30 text-xs font-medium text-amber-200 transition-all text-center cursor-pointer active:scale-95 shadow-sm truncate"
                title="Login as Brand Packager Vikramaditya Roy"
              >
                Packager
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <span>✅</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Working Email and Password Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email Address</label>
              <GlassInputWrapper>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  value={inputEmail} 
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="Enter your email address" 
                  className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/60" 
                />
              </GlassInputWrapper>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
              <GlassInputWrapper>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={inputPassword} 
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter your password" 
                    className="w-full bg-transparent text-sm p-3.5 pr-12 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/60" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </GlassInputWrapper>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" name="rememberMe" defaultChecked className="custom-checkbox" />
                <span className="text-foreground/80">Keep me signed in</span>
              </label>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} 
                className="hover:underline text-violet-400 transition-colors"
              >
                Reset password
              </a>
            </div>

            <button 
              type="submit" 
              className="w-full rounded-2xl bg-primary py-3.5 font-medium text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-lg active:scale-[0.99] text-sm mt-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
