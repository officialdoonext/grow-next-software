"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mail,
  ArrowRight,
  ArrowDown,
  Download,
  ShieldAlert,
  User,
  Store,
  Calendar,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CustomSearchDropdown, { DropdownOption } from "./CustomSearchDropdown";
import CustomDateTimePicker from "./CustomDateTimePicker";
import CustomAccordion from "./CustomAccordion";
import PwaInstallModal from "./PwaInstallModal";
import CompleteProfileModal from "./CompleteProfileModal";
import AccountPendingScreen from "./AccountPendingScreen";

export default function LoginScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"admin" | "staff">("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [staffId, setStaffId] = useState("");
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [shiftDateTime, setShiftDateTime] = useState<Date | null>(new Date());

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // OTP flow state
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(45);
  const [isVerifying, setIsVerifying] = useState(false);

  // User & Profile State
  const [pendingUser, setPendingUser] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // PWA modal state
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Showcase drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check existing session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const queryParam = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
        const res = await fetch(`/api/auth/session${queryParam}`);
        const data = await res.json();
        if (data.authenticated && data.user) {
          if (data.user.email) {
            localStorage.setItem("grownext_user_email", data.user.email);
            document.cookie = `grownext_user=${encodeURIComponent(data.user.email)}; path=/; max-age=2592000; SameSite=Lax`;
          }
          if (data.isApproved) {
            const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
            router.push(isMobile ? "/home" : "/dashboard");
            return;
          } else {
            setPendingUser(data.user);
          }
        }
      } catch {
        // Continue to login screen if not authenticated
      } finally {
        setIsCheckingSession(false);
      }
    }
    checkSession();
  }, [router]);

  // Timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOtpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const rawEmail = activeTab === "admin" ? adminEmail : staffId;
    const emailToSend = rawEmail.trim().toLowerCase();

    if (!emailToSend) {
      setErrorMessage(
        activeTab === "admin"
          ? "Please enter your administrator email address."
          : "Please enter your staff email or ID."
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setAdminEmail(emailToSend);
      setIsOtpSent(true);
      setResendTimer(45);
      setOtpValues(["", "", "", "", "", ""]);
      setInfoMessage(data.message || `Verification code sent to ${emailToSend}`);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otpValues];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpValues(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = value.replace(/\D/g, "");
    setOtpValues(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const enteredOtp = otpValues.join("");
    if (enteredOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of your verification code.");
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          otp: enteredOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Verification failed");
      }

      // Check if profile exists
      if (!data.hasProfile) {
        // No profile found -> Ask for Name, Mobile, Email, City, Address
        setShowProfileModal(true);
      } else {
        if (data.profile?.email) {
          localStorage.setItem("grownext_user_email", data.profile.email);
          document.cookie = `grownext_user=${encodeURIComponent(data.profile.email)}; path=/; max-age=2592000; SameSite=Lax`;
        }
        // Profile exists: Check approval (Active status AND unexpired license)
        if (data.isApproved) {
          const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
          router.push(isMobile ? "/home" : "/dashboard");
        } else {
          // Account is inactive or expired
          setPendingUser(data.profile);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProfileCreated = (profile: any) => {
    setShowProfileModal(false);
    if (profile?.email) {
      localStorage.setItem("grownext_user_email", profile.email);
      document.cookie = `grownext_user=${encodeURIComponent(profile.email)}; path=/; max-age=2592000; SameSite=Lax`;
    }
    // Profile is created with inactive status and null expiry
    setPendingUser(profile);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
    localStorage.removeItem("grownext_user_email");
    document.cookie = "grownext_session=; path=/; max-age=0";
    document.cookie = "grownext_user=; path=/; max-age=0";
    setPendingUser(null);
    setIsOtpSent(false);
    setOtpValues(["", "", "", "", "", ""]);
  };

  // Loading state while checking persistent session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-4">
        <div className="relative w-[150px] h-[48px] mb-4 flex items-center justify-center">
          <Image
            src="/grownext-logo.jpeg"
            alt="GrowNext"
            width={150}
            height={48}
            priority
            className="object-contain mix-blend-multiply"
          />
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium">
          <RefreshCw size={14} className="animate-spin text-[#6024a8]" />
          <span>Restoring session...</span>
        </div>
      </div>
    );
  }

  // If user is logged in but pending activation/license, render AccountPendingScreen
  if (pendingUser) {
    return (
      <AccountPendingScreen
        user={pendingUser}
        onRefresh={async () => {
          const res = await fetch(`/api/auth/session?email=${encodeURIComponent(pendingUser.email)}`);
          const data = await res.json();
          if (data.user) {
            setPendingUser(data.user);
            if (data.isApproved) {
              const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
              router.push(isMobile ? "/home" : "/dashboard");
            }
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  // Sample store options for the Custom Search Dropdown
  const storeOptions: DropdownOption[] = [
    {
      value: "store-1",
      label: "Downtown Flagship - Terminal 01",
      description: "Counter A • Main Floor",
      badge: "Active",
      icon: <Store size={14} />,
    },
    {
      value: "store-2",
      label: "Metro Galleria Mall - Register 03",
      description: "Level 2 • Electronics Zone",
      badge: "Active",
      icon: <Store size={14} />,
    },
    {
      value: "store-3",
      label: "Airport Terminal 3 Express - Station 01",
      description: "Concourse B • Duty Free",
      badge: "Standby",
      icon: <Store size={14} />,
    },
    {
      value: "store-4",
      label: "Westside Superstore - Express Checkout",
      description: "Lane 05 • Quick Pay",
      badge: "Active",
      icon: <Store size={14} />,
    },
    {
      value: "store-5",
      label: "North District Hub - Cashier Station",
      description: "Service Desk • Return Counter",
      badge: "Standby",
      icon: <Store size={14} />,
    },
  ];

  // Sample accordion items
  const sampleAccordionItems = [
    {
      id: "guidelines",
      title: "UI Design Specifications & Standards",
      badge: "Strict Rules",
      content: (
        <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
          <li><strong>Input / Button / Dropdown / Accordion Header:</strong> Maximum height strictly 34px.</li>
          <li><strong>Border Radius:</strong> Maximum 6px across every component and container.</li>
          <li><strong>Font Family:</strong> Sora font only.</li>
          <li><strong>Font Weight:</strong> Maximum 500 only (no 600, 700 or heavy weights).</li>
        </ul>
      ),
    },
    {
      id: "security",
      title: "Security Protocol & Multi-Factor Auth",
      badge: "Enterprise",
      content: (
        <p className="text-slate-600 leading-relaxed">
          Sessions are end-to-end encrypted with rotating OTP keys. User activity logs and device fingerprints are verified against authorized network subnets.
        </p>
      ),
    },
    {
      id: "terminals",
      title: "Supported Peripherals & Offline Cache",
      content: (
        <p className="text-slate-600 leading-relaxed">
          Full support for receipt printers, barcode scanners, and customer-facing secondary displays.
        </p>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center py-10 px-4 bg-[#fafafc] overflow-x-hidden">
      {/* Background Soft Glow Accents */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 50% at 8% 20%, rgba(96, 36, 168, 0.045) 0%, transparent 70%),
            radial-gradient(ellipse 45% 45% at 92% 75%, rgba(13, 166, 120, 0.035) 0%, transparent 70%),
            radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.9) 0%, transparent 100%)
          `,
        }}
      />

      {/* Top right drawer trigger to view/test custom components */}
      <div className="fixed top-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="h-[32px] max-h-[34px] px-3 bg-white/90 backdrop-blur-xs border border-slate-200 hover:border-slate-300 text-slate-700 text-[12px] font-medium rounded-[6px] flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Sliders size={13} className="text-[#6024a8]" />
          <span>Interactive Components</span>
          <ChevronRight size={13} className="text-slate-400" />
        </button>
      </div>

      {/* Center Container */}
      <div className="relative z-10 w-full flex flex-col items-center my-auto">
        {/* Logo Section using grownext-logo.jpeg */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative w-[196px] h-[64px] flex items-center justify-center">
            <Image
              src="/grownext-logo.jpeg"
              alt="GrowNext Logo - powered by Doonext"
              width={196}
              height={64}
              priority
              className="object-contain mix-blend-multiply"
            />
          </div>
          <div className="mt-2">
            <span className="text-[11px] font-medium text-[#8c97a8] tracking-[0.22em] uppercase">
              SMART RETAIL
            </span>
          </div>
        </div>

        {/* Card 1: Main Login Card */}
        <div className="w-full max-w-[392px] bg-white rounded-[6px] border border-[#edf0f5] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] p-6 transition-all duration-200">
          {/* Top Switcher Tabs */}
          <div className="w-full h-[34px] max-h-[34px] bg-[#f0f2f6] p-[3px] rounded-[6px] flex items-center gap-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setIsOtpSent(false);
                setErrorMessage(null);
              }}
              className={`flex-1 h-[28px] max-h-[34px] rounded-[5px] text-[12.5px] font-medium flex items-center justify-center transition-all ${
                activeTab === "admin"
                  ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 hover:text-slate-700 bg-transparent"
              }`}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("staff");
                setIsOtpSent(false);
                setErrorMessage(null);
              }}
              className={`flex-1 h-[28px] max-h-[34px] rounded-[5px] text-[12.5px] font-medium flex items-center justify-center transition-all ${
                activeTab === "staff"
                  ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 hover:text-slate-700 bg-transparent"
              }`}
            >
              Staff Login
            </button>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-[6px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-[12px] text-rose-600 animate-in fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isOtpSent ? (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyOtp} className="animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12.5px] font-medium text-slate-800">
                  Verification Code
                </span>
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="text-[11.5px] font-medium text-[#6024a8] hover:underline"
                >
                  Change Email
                </button>
              </div>

              <p className="text-[11.5px] text-[#8893a7] mb-4">
                Enter the 6-digit code sent to{" "}
                <span className="text-slate-700 font-medium">
                  {adminEmail || "admin@yourbusiness.com"}
                </span>
              </p>

              {/* 6 Digit Input Boxes */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-full h-[34px] max-h-[34px] rounded-[6px] border border-slate-200 bg-[#f8fafc] text-center text-[15px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all"
                  />
                ))}
              </div>

              {/* Resend Code Timer */}
              <div className="flex items-center justify-between text-[11.5px] text-slate-500 mb-4">
                <span>Didn't receive code?</span>
                {resendTimer > 0 ? (
                  <span className="text-slate-400 font-medium">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#6024a8] hover:underline font-medium flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Resend Code
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] active:bg-[#45167e] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isVerifying ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Verify & Enter</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : activeTab === "admin" ? (
            /* Admin Login Form - EXACT match to screenshot */
            <form onSubmit={handleSendOtp}>
              <label
                htmlFor="admin-email-input"
                className="block text-[12.5px] font-medium text-slate-800 mb-1.5"
              >
                Administrator Email Address
              </label>

              {/* Input field */}
              <div className="relative flex items-center">
                <Mail
                  size={15}
                  className="absolute left-2.5 text-[#94a3b8] pointer-events-none"
                />
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@yourbusiness.com"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[13px] text-slate-800 placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                />
              </div>

              {/* Helper text */}
              <p className="text-[11.5px] text-[#8893a7] mt-1.5 mb-5 font-normal">
                We will send a one-time 6-digit verification code to this inbox.
              </p>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] active:bg-[#45167e] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span>Generating Code...</span>
                ) : (
                  <>
                    <span>Send OTP Code</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Staff Login Form */
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label
                  htmlFor="staff-id-input"
                  className="block text-[12.5px] font-medium text-slate-800 mb-1"
                >
                  Staff Member ID or Email
                </label>
                <div className="relative flex items-center">
                  <User
                    size={15}
                    className="absolute left-2.5 text-[#94a3b8] pointer-events-none"
                  />
                  <input
                    id="staff-id-input"
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="cashier.sarah@retailnext.com"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[13px] text-slate-800 placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>

              {/* Custom Searchable Dropdown */}
              <CustomSearchDropdown
                label="Assigned Store / Terminal"
                options={storeOptions}
                value={selectedStore}
                onChange={setSelectedStore}
                searchPlaceholder="Search store branch or terminal..."
              />

              {/* Custom Date & Time Picker */}
              <CustomDateTimePicker
                label="Session Shift Schedule & Time"
                value={shiftDateTime}
                onChange={setShiftDateTime}
                placeholder="Pick shift schedule..."
              />

              <button
                type="submit"
                className="w-full h-[34px] max-h-[34px] mt-2 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] active:bg-[#45167e] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Authorize Terminal Access</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Security & Monitoring footer notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10.5px] text-[#94a3b8] leading-tight font-normal">
              Restricted Access for Authorized Personnel Only.
            </p>
            <p className="text-[10.5px] text-[#94a3b8] leading-tight font-normal mt-0.5">
              Unauthorized access attempts are monitored and logged.
            </p>
          </div>
        </div>

        {/* Card 2: PWA Install App Card */}
        <div className="w-full max-w-[392px] bg-white rounded-[6px] border border-[#edf0f5] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-3 px-4 mt-3.5 transition-all duration-200">
          <div className="flex items-center gap-3">
            {/* Square Purple Icon */}
            <div className="w-[34px] h-[34px] max-h-[34px] rounded-[6px] bg-[#6024a8] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download size={16} strokeWidth={2} />
            </div>

            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-medium text-slate-800 truncate">
                  Install GrowNext App
                </span>
                <span className="text-[10px] font-medium text-[#7c3aed] bg-[#f3e8ff] px-1.5 py-0.2 rounded-[4px] shrink-0">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-[#8893a7] font-normal truncate mt-0.5">
                Install for faster access & auto updates
              </p>
            </div>
          </div>

          {/* Install App Button */}
          <div className="flex justify-center mt-2.5">
            <button
              type="button"
              onClick={() => setIsPwaModalOpen(true)}
              className="h-[32px] max-h-[34px] px-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-[#f8fafc] text-slate-700 text-[12px] font-medium rounded-[6px] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>Install App</span>
              <ArrowDown size={13} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Complete Profile Modal */}
      <CompleteProfileModal
        isOpen={showProfileModal}
        email={adminEmail}
        onSuccess={handleProfileCreated}
      />

      {/* PWA Installation Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        onInstall={() => {
          setIsPwaInstalled(true);
          setTimeout(() => setIsPwaModalOpen(false), 900);
        }}
        isInstalled={isPwaInstalled}
      />

      {/* Side Slide-out Drawer: Component Showcase */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[99998] flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-[14px] font-medium text-slate-900">
                    Custom Component Specs
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live interactive sandbox adhering to design rules
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Accordion Component */}
              <div className="mb-6">
                <span className="block text-[12px] font-medium text-slate-700 mb-2">
                  1. Custom Accordion (Header max-height: 34px, radius: 6px)
                </span>
                <CustomAccordion
                  items={sampleAccordionItems}
                  defaultOpenId="guidelines"
                />
              </div>

              {/* Custom Search Dropdown Component */}
              <div className="mb-6">
                <span className="block text-[12px] font-medium text-slate-700 mb-2">
                  2. Custom Searchable Dropdown (Top Layer Z-Index)
                </span>
                <CustomSearchDropdown
                  options={storeOptions}
                  value={selectedStore}
                  onChange={setSelectedStore}
                  searchPlaceholder="Filter registers or branches..."
                />
              </div>

              {/* Custom Calendar & Time Picker Component */}
              <div className="mb-6">
                <span className="block text-[12px] font-medium text-slate-700 mb-2">
                  3. Custom Calendar Date & Time Picker
                </span>
                <CustomDateTimePicker
                  value={shiftDateTime}
                  onChange={setShiftDateTime}
                  placeholder="Select cashier date and shift..."
                />
              </div>

              {/* Strict Rule Constraints */}
              <div className="p-3 bg-slate-50 rounded-[6px] border border-slate-200 text-[11.5px] text-slate-600 space-y-1.5">
                <div className="font-medium text-slate-800">Verified Rule Constraints:</div>
                <div className="flex items-center justify-between">
                  <span>Input / Button / Dropdown max height:</span>
                  <span className="font-medium text-[#6024a8] bg-purple-50 px-1.5 py-0.5 rounded-[4px]">
                    34px
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Border radius everywhere:</span>
                  <span className="font-medium text-[#6024a8] bg-purple-50 px-1.5 py-0.5 rounded-[4px]">
                    ≤ 6px
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Font family:</span>
                  <span className="font-medium text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded-[4px]">
                    Sora only
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Font weight ceiling:</span>
                  <span className="font-medium text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded-[4px]">
                    ≤ 500 max
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full h-[34px] max-h-[34px] mt-4 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium transition-colors"
            >
              Return to Login Screen
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center py-2">
        <span className="text-[11px] text-slate-400 font-normal">
          © {new Date().getFullYear()} GrowNext • Smart Retail System
        </span>
      </footer>
    </div>
  );
}
