import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Zap, ChevronDown, Check, Building2, Shield, HeartPulse, User } from 'lucide-react';

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
  onSignIn?: (credentials: { email: string; password: string; role?: 'inspector' | 'fssai' | 'packager' }) => void;
  onResetPassword?: () => void;
  onQuickDemo?: (role: 'inspector' | 'fssai' | 'packager') => void;
  errorMessage?: string | null;
  statusMessage?: string | null;
}

// Pre-seeded test accounts
const TEST_ACCOUNTS = [
  {
    role: 'inspector' as const,
    roleTitle: 'Senior Legal Metrology Inspector',
    name: 'Sh. Rajeshwar Singh',
    id: 'LM-INSP-DEL-4091',
    email: 'inspector.delhi@lmpc.gov.in',
    pass: 'Inspector@2026',
    icon: '🛡️',
    badgeClass: 'text-violet-400 bg-violet-500/10 border-violet-500/30'
  },
  {
    role: 'fssai' as const,
    roleTitle: 'FSSAI Food Safety Officer',
    name: 'Dr. Sunita Deshmukh',
    id: 'FSSAI-FSO-1024',
    email: 'officer.fssai@gov.in',
    pass: 'FSSAI@2026',
    icon: '🔬',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    role: 'packager' as const,
    roleTitle: 'Brand Packager Compliance Officer',
    name: 'Vikramaditya Roy',
    id: 'MFG-3302',
    email: 'compliance@dabur.com',
    pass: 'Packager@2026',
    icon: '📦',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  }
];

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your statutory account and continue regulatory & packaging compliance operations",
  onSignIn,
  onResetPassword,
  onQuickDemo,
  errorMessage,
  statusMessage,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [inputIdentifier, setInputIdentifier] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'inspector' | 'fssai' | 'packager'>('inspector');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSelectTestAccount = (acc: typeof TEST_ACCOUNTS[number]) => {
    setInputIdentifier(acc.id); // Autofills with their official ID (e.g. MFG-3302 or LM-INSP-DEL-4091)
    setInputPassword(acc.pass);
    setSelectedRole(acc.role);
    setDropdownOpen(false);

    if (onQuickDemo) {
      onQuickDemo(acc.role);
    } else if (onSignIn) {
      onSignIn({ email: acc.id, password: acc.pass, role: acc.role });
    }
  };

  const handleRoleNavbarClick = (role: 'inspector' | 'fssai' | 'packager') => {
    setSelectedRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignIn) {
      onSignIn({ email: inputIdentifier, password: inputPassword, role: selectedRole });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-10 bg-background text-foreground selection:bg-violet-500/30 overflow-y-auto">
      {/* Spacious, Wide Sign-In Card (max-w-3xl) to eliminate clustering */}
      <div className="w-full max-w-3xl bg-[#121215] border border-[#27272a] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl my-6">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-7">
          {/* Header & Test Account Dropdown Header Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#27272a] pb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                {description}
              </p>
            </div>

            {/* Test Accounts Dropdown with ChevronDown Arrow */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/40 text-violet-200 text-xs font-semibold transition-all cursor-pointer shadow-md hover:border-violet-400 active:scale-95"
                title="Select from pre-configured test accounts"
              >
                <Zap className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Quick Test Accounts</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Options */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#18181c] border border-[#2e2e34] rounded-2xl shadow-2xl p-2 z-50 animate-element">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                    Select Account (Auto-Fill & Log In)
                  </div>
                  <div className="space-y-1 mt-1">
                    {TEST_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleSelectTestAccount(acc)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-start gap-3 cursor-pointer group"
                      >
                        <span className="text-lg mt-0.5">{acc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white flex items-center justify-between">
                            <span className="truncate">{acc.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono ${acc.badgeClass}`}>
                              {acc.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">{acc.roleTitle}</div>
                          <div className="text-[10px] text-zinc-500 font-mono truncate">{acc.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Notifications */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2.5">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5">
              <span>✅</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Email or Officer/Packager ID */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Step 1 • Email Address or Officer / Packager ID
                </label>
                <span className="text-[11px] text-violet-400">Packager IDs (e.g. MFG-3302) supported</span>
              </div>
              <GlassInputWrapper>
                <input 
                  name="email" 
                  type="text" 
                  required 
                  value={inputIdentifier} 
                  onChange={(e) => setInputIdentifier(e.target.value)}
                  placeholder="Enter your email or ID (e.g. compliance@dabur.com or MFG-3302)" 
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/60" 
                />
              </GlassInputWrapper>
            </div>

            {/* Step 2: Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Step 2 • Password
              </label>
              <GlassInputWrapper>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={inputPassword} 
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter your statutory account password" 
                    className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/60" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </GlassInputWrapper>
            </div>

            {/* Step 3: Navbar of Three Role Options (Inspector, FSSAI, Packager) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Step 3 • Select Role
                </label>
                <span className="text-[11px] text-violet-400">Click to select role, then Sign In below</span>
              </div>

              {/* The 3-Option Role Navbar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-[#09090b]/80 border border-[#27272a]">
                {/* Option 1: Inspector */}
                <button
                  type="button"
                  onClick={() => handleRoleNavbarClick('inspector')}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRole === 'inspector'
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-[1.02] border-violet-400 ring-2 ring-violet-500/40'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border-transparent hover:border-white/10'
                  }`}
                  title="Select Legal Metrology Inspector role"
                >
                  <Shield className="w-4 h-4" />
                  <span>1. Inspector</span>
                  {selectedRole === 'inspector' && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-white/20 font-medium">Selected</span>
                  )}
                </button>

                {/* Option 2: FSSAI Officer */}
                <button
                  type="button"
                  onClick={() => handleRoleNavbarClick('fssai')}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRole === 'fssai'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02] border-emerald-400 ring-2 ring-emerald-500/40'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border-transparent hover:border-white/10'
                  }`}
                  title="Select FSSAI Food Safety Officer role"
                >
                  <HeartPulse className="w-4 h-4" />
                  <span>2. FSSAI Officer</span>
                  {selectedRole === 'fssai' && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-white/20 font-medium">Selected</span>
                  )}
                </button>

                {/* Option 3: Brand Packager */}
                <button
                  type="button"
                  onClick={() => handleRoleNavbarClick('packager')}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRole === 'packager'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-[1.02] border-amber-400 ring-2 ring-amber-500/40'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border-transparent hover:border-white/10'
                  }`}
                  title="Select Brand Packager (MFG) role"
                >
                  <Building2 className="w-4 h-4" />
                  <span>3. Packager</span>
                  {selectedRole === 'packager' && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-white/20 font-medium">Selected</span>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Reset Password Controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
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

            {/* Main Submit Button */}
            <button 
              type="submit" 
              className="w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xl active:scale-[0.99] text-sm mt-2 tracking-wide flex items-center justify-center gap-2"
            >
              <span>Sign In to Regulatory Portal</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-normal">
                {selectedRole === 'inspector' ? 'as Inspector' : selectedRole === 'fssai' ? 'as FSSAI Officer' : 'as Packager'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
