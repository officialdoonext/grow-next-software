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
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  ArrowLeft,
  Users,
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

  // Staff Login specific state
  const [staffMobile, setStaffMobile] = useState("");
  const [staffMpin, setStaffMpin] = useState("");
  const [showStaffMpin, setShowStaffMpin] = useState(false);
  const [staffProfiles, setStaffProfiles] = useState<any[] | null>(null);
  const [isStaffSubmitting, setIsStaffSubmitting] = useState(false);

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

  const handleStaffLogin = async (e?: React.FormEvent, selectedStaffId?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanMobile = staffMobile.replace(/[^0-9]/g, "").trim();
    const cleanMpin = staffMpin.replace(/[^0-9]/g, "").trim();

    if (cleanMobile.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (cleanMpin.length < 4 || cleanMpin.length > 6) {
      setErrorMessage("Please enter your 4 to 6 digit MPIN.");
      return;
    }

    setIsStaffSubmitting(true);
    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          mpin: cleanMpin,
          staffId: selectedStaffId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Staff login failed. Please check your credentials.");
      }

      // If multiple business profiles are detected for this phone number
      if (data.multipleProfiles && Array.isArray(data.profiles)) {
        setStaffProfiles(data.profiles);
        return;
      }

      // Single profile authorized directly
      if (data.staff?.ownerEmail) {
        localStorage.setItem("grownext_user_email", data.staff.ownerEmail);
      }
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      router.push(isMobile ? "/home" : (data.redirectUrl || "/dashboard"));
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in as staff.");
    } finally {
      setIsStaffSubmitting(false);
    }
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
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center py-10 px-4 bg-[#f8f9fd] overflow-x-hidden font-sans text-slate-800 antialiased">
      {/* Ambient Decorative Gradient Blobs matching Redesigned Software Pages */}
      <div className="fixed -top-28 -right-28 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-200/40 via-purple-100/20 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[320px] h-[320px] rounded-bl-[140px] bg-gradient-to-b from-purple-100/35 to-transparent pointer-events-none z-0" />
      <div className="fixed -bottom-28 -left-28 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-purple-200/35 via-rose-100/20 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Top right drawer trigger to view/test custom components */}
      <div className="fixed top-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="h-[32px] max-h-[34px] px-3 bg-white/90 backdrop-blur-xs border border-slate-200/90 hover:border-slate-300 text-slate-700 text-[12px] font-medium rounded-[6px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <Sliders size={13} className="text-[#7c3aed]" />
          <span>Components Sandbox</span>
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
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-[10.5px] font-medium text-slate-400 tracking-[0.16em] uppercase">
              Business Management Suite
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-medium text-[#7c3aed] bg-[#f5ecfc] border border-[#ede9fe] px-1.5 py-0.2 rounded-[4px]">
              Cloud Gateway
            </span>
          </div>
        </div>

        {/* Card 1: Main Login Card */}
        <div className="w-full max-w-[400px] bg-white rounded-[8px] border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-6 sm:p-7 transition-all duration-200">
          {/* Top Switcher Tabs */}
          <div className="w-full h-[34px] max-h-[34px] bg-[#f1f3f9] p-[3px] rounded-[6px] flex items-center gap-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setIsOtpSent(false);
                setStaffProfiles(null);
                setErrorMessage(null);
              }}
              className={`flex-1 h-[28px] max-h-[34px] rounded-[5px] text-[12.5px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-slate-900 shadow-2xs"
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
                setStaffProfiles(null);
                setErrorMessage(null);
              }}
              className={`flex-1 h-[28px] max-h-[34px] rounded-[5px] text-[12.5px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "staff"
                  ? "bg-white text-slate-900 shadow-2xs"
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
                  className="text-[11.5px] font-medium text-[#7c3aed] hover:underline cursor-pointer"
                >
                  Change Email
                </button>
              </div>

              <p className="text-[11.5px] text-slate-500 mb-4 font-normal">
                Enter the 6-digit code sent to{" "}
                <span className="text-slate-800 font-medium">
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
                    className="w-full h-[34px] max-h-[34px] rounded-[6px] border border-slate-200 bg-[#f8fafc] text-center text-[15px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all"
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
                    className="text-[#7c3aed] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} /> Resend Code
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-70"
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
            /* Admin Login Form */
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
                  className="absolute left-2.5 text-slate-400 pointer-events-none"
                />
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@yourbusiness.com"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
                />
              </div>

              {/* Helper text */}
              <p className="text-[11.5px] text-slate-500 mt-1.5 mb-5 font-normal">
                We will send a one-time 6-digit verification code to this inbox.
              </p>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span>Generating Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : staffProfiles && staffProfiles.length > 0 ? (
            /* Multi-Profile Onboarding Selection Screen */
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStaffProfiles(null)}
                    className="w-7 h-7 max-h-[34px] rounded-[6px] hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Back to login"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <div>
                    <h3 className="text-[13px] font-medium text-slate-900 leading-tight">
                      Select Workspace
                    </h3>
                    <p className="text-[10.5px] text-slate-500">
                      Choose profile to enter
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#7c3aed] bg-[#f5edfd] border border-[#ddd6fe] px-2 py-0.5 rounded-[4px]">
                  {staffProfiles.length} Workspaces
                </span>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5">
                {staffProfiles.map((prof: any) => (
                  <div
                    key={prof.staffId}
                    className="p-3 rounded-[6px] border border-slate-200/90 bg-[#fbfbfe] hover:bg-white hover:border-[#7c3aed]/50 transition-all flex items-center justify-between gap-2.5 shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-[32px] h-[32px] rounded-[6px] bg-[#eef2ff] border border-[#c7d2fe] text-[#4f46e5] flex items-center justify-center font-medium text-[13px] shrink-0">
                        {prof.businessName ? prof.businessName.charAt(0).toUpperCase() : "B"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium text-slate-900 truncate">
                          {prof.businessName || "Business Workspace"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <span>Staff: {prof.staffName}</span>
                          <span>•</span>
                          <span className="text-[#059669]">
                            {prof.allowedCount || 0} modules
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isStaffSubmitting}
                      onClick={() => handleStaffLogin(undefined, prof.staffId)}
                      className="h-[30px] max-h-[34px] px-3 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[11.5px] font-medium flex items-center gap-1 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-70"
                    >
                      {isStaffSubmitting ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <>
                          <span>Enter</span>
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Staff Mobile & MPIN Login Form */
            <form onSubmit={handleStaffLogin} className="space-y-3.5 animate-in fade-in duration-200">
              {/* Mobile Number Input */}
              <div>
                <label
                  htmlFor="staff-mobile-input"
                  className="block text-[12.5px] font-medium text-slate-800 mb-1"
                >
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <Phone
                    size={15}
                    className="absolute left-2.5 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="staff-mobile-input"
                    type="tel"
                    required
                    maxLength={10}
                    value={staffMobile}
                    onChange={(e) => setStaffMobile(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Registered 10-digit mobile number.
                </p>
              </div>

              {/* MPIN Input */}
              <div>
                <label
                  htmlFor="staff-mpin-input"
                  className="block text-[12.5px] font-medium text-slate-800 mb-1"
                >
                  Security MPIN (4-6 Digits)
                </label>
                <div className="relative flex items-center">
                  <Lock
                    size={15}
                    className="absolute left-2.5 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="staff-mpin-input"
                    type={showStaffMpin ? "text" : "password"}
                    required
                    maxLength={6}
                    value={staffMpin}
                    onChange={(e) => setStaffMpin(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Enter 4-6 digit MPIN"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-9 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffMpin(!showStaffMpin)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showStaffMpin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isStaffSubmitting}
                className="w-full h-[34px] max-h-[34px] mt-2 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isStaffSubmitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Verify & Enter Workspace</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security & Monitoring footer notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10.5px] text-slate-400 leading-tight font-normal">
              Restricted Access for Authorized Personnel Only.
            </p>
            <p className="text-[10.5px] text-slate-400 leading-tight font-normal mt-0.5">
              Multi-tenant isolated & encrypted session gateway.
            </p>
          </div>
        </div>

        {/* Card 2: PWA Install App Card */}
        <div className="w-full max-w-[400px] bg-white rounded-[8px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-3 px-4 mt-3.5 transition-all duration-200">
          <div className="flex items-center gap-3">
            {/* Square Purple Icon */}
            <div className="w-[34px] h-[34px] max-h-[34px] rounded-[6px] bg-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-xs">
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
              <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                Install for quick launch & offline caching
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
                  <span className="font-medium text-[#7c3aed] bg-purple-50 px-1.5 py-0.5 rounded-[4px]">
                    34px
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Border radius everywhere:</span>
                  <span className="font-medium text-[#7c3aed] bg-purple-50 px-1.5 py-0.5 rounded-[4px]">
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
              className="w-full h-[34px] max-h-[34px] mt-4 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[12px] font-medium transition-colors cursor-pointer"
            >
              Return to Login Screen
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center py-2">
        <span className="text-[11px] text-slate-400 font-normal">
          © {new Date().getFullYear()} GrowNext • Enterprise Business Management Platform
        </span>
      </footer>
    </div>
  );
}
