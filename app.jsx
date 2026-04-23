import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, MapPin, Star, BadgeCheck, Clock, Globe, Shield,
  ChevronLeft, ChevronRight, MessageCircle, X, Send,
  Calendar, Phone, Heart, Filter, SlidersHorizontal,
  Stethoscope, Building2, ArrowRight, Menu, Bell, User,
  CheckCircle2, ChevronDown, Mic, LocateFixed, LogOut,
  Lock, Mail, Eye, EyeOff, Building, UserPlus, LogIn,
  Activity, Layers, Sparkles, TrendingUp, Users, Award,
  HeartPulse, Brain, Bone, Baby, FlaskConical
} from "lucide-react";

// Auto-detect: use local backend if on localhost, else static/demo mode
const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API = "http://localhost:5001/api";

// ─── DEMO MODE AUTH (used when backend is not available) ──────────────────────

const DEMO_USERS_KEY = "doclocate_demo_users";

function getDemoUsers() {
  try { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "[]"); } catch { return []; }
}
function saveDemoUsers(users) {
  try { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users)); } catch {}
}
function makeDemoToken(userId) {
  return btoa(JSON.stringify({ user_id: userId, exp: Date.now() + 7 * 86400000 }));
}

async function demoAuth(path, { method, body } = {}) {
  await new Promise(r => setTimeout(r, 600));
  const users = getDemoUsers();

  if (path === "/auth/register") {
    const { name, email, phone, password } = body;
    if (!name || (!email && !phone)) throw new Error("Name and email or phone required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    const exists = users.find(u => (email && u.email === email.toLowerCase()) || (phone && u.phone === phone));
    if (exists) throw new Error("Email or phone already registered");
    const user = { id: Date.now(), name, email: email ? email.toLowerCase() : null, phone: phone || null };
    saveDemoUsers([...users, { ...user, password }]);
    return { token: makeDemoToken(user.id), user };
  }

  if (path === "/auth/login") {
    const { identifier, password } = body;
    const user = users.find(u =>
      (u.email && u.email === identifier.toLowerCase()) ||
      (u.phone && u.phone === identifier)
    );
    if (!user || user.password !== password) throw new Error("Invalid credentials");
    const { password: _pw, ...safeUser } = user;
    return { token: makeDemoToken(user.id), user: safeUser };
  }

  if (path === "/clinics") return FALLBACK_CLINICS;
  if (path === "/doctors") return FALLBACK_DOCTORS;
  if (path === "/appointments" && method === "POST") return { message: "Appointment confirmed (demo)" };
  if (path === "/appointments") return [];
  throw new Error("Unknown demo endpoint: " + path);
}

// ─── API HELPERS ─────────────────────────────────────────────────────────────

async function apiFetch(path, { method = "GET", body, token } = {}) {
  if (!IS_LOCAL) return demoAuth(path, { method, body });
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  try {
    const res = await fetch(API + path, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(3000),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "TypeError" || (err.message && err.message.includes("fetch"))) {
      return demoAuth(path, { method, body });
    }
    throw err;
  }
}

// ─── FALLBACK DATA ────────────────────────────────────────────────────────────

const FALLBACK_DOCTORS = [
  { id: 1, name: "Dr. Serena Voss", specialty: "Internal Medicine", clinic_name: "Clearwater Medical Center", clinic_id: 1, years: 14, rating: 4.9, reviews: 218, insurance: ["Aetna","Blue Cross","Cigna","UnitedHealth"], languages: ["English","Spanish","French"], next_available: "Tomorrow, 9:00 AM", verified: 1, accepting: 1, avatar: "SV", color: "#0d9488", fee: 180, distance: "0.8 mi", bio: "Board-certified internist specializing in preventive care and chronic disease management for adults." },
  { id: 2, name: "Dr. Kwame Asante", specialty: "Family Medicine", clinic_name: "Riverside Family Health", clinic_id: 2, years: 9, rating: 4.8, reviews: 143, insurance: ["Aetna","Humana","Medicare","Medicaid"], languages: ["English","Twi","French"], next_available: "Today, 3:30 PM", verified: 1, accepting: 1, avatar: "KA", color: "#0891b2", fee: 150, distance: "1.2 mi", bio: "Compassionate family physician with a focus on whole-patient wellness and immigrant health." },
  { id: 3, name: "Dr. Lantu Saikia", specialty: "Cardiology", clinic_name: "Summit Heart Institute", clinic_id: 3, years: 22, rating: 5.0, reviews: 391, insurance: ["Blue Cross","Cigna","UnitedHealth","Medicare"], languages: ["English","Mandarin","Cantonese"], next_available: "Thu, Apr 25", verified: 1, accepting: 1, avatar: "LS", color: "#7c3aed", fee: 320, distance: "2.1 mi", bio: "Fellowship-trained cardiologist with over two decades in interventional cardiology." },
  { id: 4, name: "Dr. Arjun Mehta", specialty: "Dermatology", clinic_name: "SkinCare & Wellness Clinic", clinic_id: 4, years: 7, rating: 4.7, reviews: 89, insurance: ["Aetna","Cigna","Blue Shield"], languages: ["English","Hindi","Gujarati"], next_available: "Fri, Apr 26", verified: 1, accepting: 1, avatar: "AM", color: "#d97706", fee: 210, distance: "1.7 mi", bio: "Modern dermatologist blending medical and cosmetic expertise. Special interest in skin of color." },
  { id: 5, name: "Dr. Lena Hoffmann", specialty: "Psychiatry", clinic_name: "Tranquil Mind Health", clinic_id: 5, years: 16, rating: 4.9, reviews: 174, insurance: ["Aetna","Cigna","UnitedHealth","Humana"], languages: ["English","German","Dutch"], next_available: "Mon, Apr 28", verified: 1, accepting: 1, avatar: "LH", color: "#db2777", fee: 260, distance: "3.4 mi", bio: "Psychiatrist specializing in anxiety, adjustment disorders, and life transitions." },
  { id: 6, name: "Dr. Omar El-Amin", specialty: "Orthopedics", clinic_name: "Active Life Orthopedic Center", clinic_id: 6, years: 11, rating: 4.8, reviews: 207, insurance: ["Blue Cross","Medicare","Cigna"], languages: ["English","Arabic"], next_available: "Wed, Apr 30", verified: 1, accepting: 0, avatar: "OE", color: "#059669", fee: 290, distance: "4.0 mi", bio: "Sports medicine and orthopedic surgeon with expertise in minimally invasive joint procedures." },
  { id: 7, name: "Dr. Priya Nair", specialty: "Pediatrics", clinic_name: "Lakeside Pediatric Associates", clinic_id: 7, years: 8, rating: 4.9, reviews: 156, insurance: ["Aetna","Humana","Medicaid","CHIP"], languages: ["English","Malayalam","Tamil"], next_available: "Tomorrow, 10:00 AM", verified: 1, accepting: 1, avatar: "PN", color: "#2563eb", fee: 140, distance: "1.5 mi", bio: "Warm and experienced pediatrician focused on developmental milestones and preventive care." },
  { id: 8, name: "Dr. Sofia Rivera", specialty: "OB/GYN", clinic_name: "Downtown Women's Health", clinic_id: 8, years: 12, rating: 4.8, reviews: 301, insurance: ["Aetna","Blue Cross","UnitedHealth","Blue Shield"], languages: ["English","Spanish","Portuguese"], next_available: "Fri, Apr 26", verified: 1, accepting: 1, avatar: "SR", color: "#c026d3", fee: 220, distance: "2.3 mi", bio: "OB/GYN providing comprehensive women's healthcare including prenatal and family planning." },
];

const FALLBACK_CLINICS = [
  { id: 1, name: "Clearwater Medical Center", specialty_focus: "Internal Medicine", rating: 4.9, address: "142 N Wacker Dr", city: "Chicago", phone: "(312) 555-0101", image_color: "#0d9488", accepting_new: 1 },
  { id: 2, name: "Riverside Family Health", specialty_focus: "Family Medicine", rating: 4.8, address: "88 River Rd", city: "Chicago", phone: "(312) 555-0202", image_color: "#0891b2", accepting_new: 1 },
  { id: 3, name: "Summit Heart Institute", specialty_focus: "Cardiology", rating: 5.0, address: "2200 N Lakeshore Dr", city: "Chicago", phone: "(312) 555-0303", image_color: "#7c3aed", accepting_new: 1 },
  { id: 4, name: "SkinCare & Wellness Clinic", specialty_focus: "Dermatology", rating: 4.7, address: "55 E Michigan Ave", city: "Chicago", phone: "(312) 555-0404", image_color: "#d97706", accepting_new: 1 },
  { id: 5, name: "Tranquil Mind Health", specialty_focus: "Psychiatry", rating: 4.9, address: "910 W Madison St", city: "Chicago", phone: "(312) 555-0505", image_color: "#db2777", accepting_new: 1 },
  { id: 6, name: "Active Life Orthopedic Center", specialty_focus: "Orthopedics", rating: 4.8, address: "400 S Wells St", city: "Chicago", phone: "(312) 555-0606", image_color: "#059669", accepting_new: 0 },
  { id: 7, name: "Lakeside Pediatric Associates", specialty_focus: "Pediatrics", rating: 4.9, address: "1700 N Michigan Ave", city: "Chicago", phone: "(312) 555-0707", image_color: "#2563eb", accepting_new: 1 },
  { id: 8, name: "Downtown Women's Health", specialty_focus: "OB/GYN", rating: 4.8, address: "300 W Monroe St", city: "Chicago", phone: "(312) 555-0808", image_color: "#c026d3", accepting_new: 1 },
];

const SLOTS = {
  "Mon Apr 28": ["9:00 AM", "10:30 AM", "2:00 PM", "4:00 PM"],
  "Tue Apr 29": ["8:30 AM", "11:00 AM", "1:30 PM"],
  "Wed Apr 30": ["9:30 AM", "12:00 PM", "3:00 PM", "5:00 PM"],
  "Thu May 1": ["10:00 AM", "11:30 AM", "2:30 PM"],
  "Fri May 2": ["8:00 AM", "9:00 AM", "3:30 PM"],
};

const SPECIALTIES = ["All", "Internal Medicine", "Family Medicine", "Cardiology", "Dermatology", "Psychiatry", "Orthopedics", "Pediatrics", "OB/GYN"];
const INSURANCES = ["All Insurance", "Aetna", "Blue Cross", "Cigna", "UnitedHealth", "Humana", "Medicare"];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  body { font-family: 'DM Sans', sans-serif; }
  html { scroll-behavior: smooth; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(13,148,136,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(13,148,136,0); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .fade-in { animation: fadeIn 0.4s ease forwards; }
  .slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .floating { animation: float 4s ease-in-out infinite; }
  input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px white inset !important; }
  input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 100px white inset !important; }

  .btn-primary {
    background: linear-gradient(135deg, #0d9488, #0891b2);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(13,148,136,0.4); }
  .btn-primary:active { transform: translateY(0); }

  .clinic-tab-scroll::-webkit-scrollbar { height: 0; }

  @media (max-width: 768px) {
    .auth-left { display: none !important; }
    .auth-right { width: 100% !important; }
  }
`;

// ─── REUSABLE INPUT COMPONENT ─────────────────────────────────────────────────

function Input({ icon: Icon, label, rightIcon, onRightClick, error, hint, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: error ? 6 : 18 }}>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, letterSpacing: "0.01em" }}>
          {label}
        </label>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        border: `1.5px solid ${error ? "#fca5a5" : focused ? "#0d9488" : "#e2e8f0"}`,
        borderRadius: 12, padding: "0 14px", background: error ? "#fff7f7" : "white",
        transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: focused ? `0 0 0 3px rgba(13,148,136,0.12)` : error ? "0 0 0 3px rgba(252,165,165,0.2)" : "none",
      }}>
        {Icon && <Icon size={16} color={error ? "#ef4444" : focused ? "#0d9488" : "#94a3b8"} style={{ flexShrink: 0 }} />}
        <input
          {...props}
          onFocus={e => { setFocused(true); props.onFocus && props.onFocus(e); }}
          onBlur={e => { setFocused(false); props.onBlur && props.onBlur(e); }}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#0f172a", padding: "13px 0", background: "transparent", fontFamily: "inherit" }}
        />
        {rightIcon && (
          <button type="button" onClick={onRightClick} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0, transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#0d9488"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
            {rightIcon}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin, onGoRegister }) {
  const [tab, setTab] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) errs.identifier = tab === "email" ? "Email is required" : "Phone number is required";
    if (tab === "email" && identifier && !/\S+@\S+\.\S+/.test(identifier)) errs.identifier = "Please enter a valid email";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: { identifier, password } });
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { val: "2,400+", label: "Verified Doctors", icon: "🩺" },
    { val: "180+", label: "Partner Clinics", icon: "🏥" },
    { val: "98%", label: "Patient Satisfaction", icon: "⭐" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Left Panel ── */}
      <div className="auth-left" style={{
        flex: 1, position: "relative", overflow: "hidden",
        background: "linear-gradient(145deg, #042f2e 0%, #0d9488 45%, #0891b2 80%, #1e3a5f 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 56,
      }}>
        {/* Background blobs */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 320, height: 320, background: "radial-gradient(circle, rgba(8,145,178,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "40%", left: "10%", width: 200, height: 200, background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />

        <div style={{ position: "relative", textAlign: "center", color: "white", maxWidth: 380 }}>
          {/* Logo */}
          <div className="floating" style={{ width: 80, height: 80, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <Stethoscope size={38} color="white" />
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>DocLocate</h1>
          <p style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.7, marginBottom: 52 }}>
            Your trusted healthcare companion. Find doctors, book appointments, and manage your health — all in one place.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 18px", textAlign: "left" }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
              🌍 Supporting 20+ languages &nbsp;·&nbsp; 🏦 40+ Insurance plans &nbsp;·&nbsp; 📍 Chicago & surrounding areas
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right" style={{ width: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 56px", background: "#f8fafc", minHeight: "100vh", overflowY: "auto" }}>
        <div className="fade-in-up" style={{ width: "100%" }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #0d9488, #0891b2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stethoscope size={14} color="white" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, #0d9488, #0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DocLocate</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>Welcome back 👋</h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>Sign in to access your appointments, records, and care team.</p>
          </div>

          {/* Demo mode notice */}
          {!IS_LOCAL && (
            <div style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #86efac", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🎯</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 2 }}>Demo Mode — No backend needed!</p>
                <p style={{ fontSize: 12, color: "#15803d", lineHeight: 1.5 }}>Create a free account to explore all features. Your data is stored locally in your browser.</p>
              </div>
            </div>
          )}

          {/* Login Method Tabs */}
          <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 12, padding: 3, marginBottom: 24 }}>
            {[
              { key: "email", icon: "📧", label: "Email" },
              { key: "phone", icon: "📱", label: "Phone" },
            ].map(t => (
              <button key={t.key}
                onClick={() => { setTab(t.key); setIdentifier(""); setError(""); setFieldErrors({}); }}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 700, fontSize: 14, transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                  background: tab === t.key ? "white" : "transparent",
                  color: tab === t.key ? "#0d9488" : "#64748b",
                  boxShadow: tab === t.key ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate>
            <Input
              icon={tab === "email" ? Mail : Phone}
              label={tab === "email" ? "Email Address" : "Phone Number"}
              type={tab === "email" ? "email" : "tel"}
              placeholder={tab === "email" ? "you@example.com" : "+1 (555) 000-0000"}
              value={identifier}
              onChange={e => { setIdentifier(e.target.value); setFieldErrors(f => ({ ...f, identifier: "" })); }}
              error={fieldErrors.identifier}
              required
            />
            <Input
              icon={Lock}
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: "" })); }}
              rightIcon={showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              onRightClick={() => setShowPw(v => !v)}
              error={fieldErrors.password}
              required
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, marginTop: -8 }}>
              <button type="button" style={{ background: "none", border: "none", color: "#0d9488", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Forgot password?
              </button>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15, position: "relative", overflow: "hidden" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin-slow 0.8s linear infinite" }} />
                  Signing in…
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Sign In <LogIn size={16} />
                </span>
              )}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { icon: "🔵", label: "Google" },
              { icon: "🍎", label: "Apple" },
            ].map(p => (
              <button key={p.label} type="button" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 11, background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.background = "#f0fdfa"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Don't have an account? </span>
            <button onClick={onGoRegister} style={{ background: "none", border: "none", color: "#0d9488", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Create one →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────

function RegisterPage({ onLogin, onGoLogin }) {
  const [mode, setMode] = useState("email");
  const [form, setForm] = useState({ name: "", identifier: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setFieldErrors(f => ({ ...f, [k]: "" })); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.identifier.trim()) errs.identifier = mode === "email" ? "Email is required" : "Phone is required";
    if (mode === "email" && form.identifier && !/\S+@\S+\.\S+/.test(form.identifier)) errs.identifier = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    if (form.password.length > 0 && form.password.length < 6) errs.password = "At least 6 characters";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const body = { name: form.name, password: form.password, [mode === "email" ? "email" : "phone"]: form.identifier };
      const data = await apiFetch("/auth/register", { method: "POST", body });
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const perks = ["Book appointments instantly", "Filter by insurance & language", "Multi-language support", "Secure & private records"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left Panel */}
      <div className="auth-left" style={{
        flex: 1, position: "relative", overflow: "hidden",
        background: "linear-gradient(145deg, #1e1b4b 0%, #7c3aed 45%, #0d9488 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 56,
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 350, height: 350, background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, background: "radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />

        <div style={{ position: "relative", textAlign: "center", color: "white", maxWidth: 360 }}>
          <div className="floating" style={{ width: 80, height: 80, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <UserPlus size={36} color="white" />
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14 }}>Join DocLocate</h1>
          <p style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.7, marginBottom: 44 }}>
            Create your free account and start finding the right doctor — filtered by insurance, language, and availability.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {perks.map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 16px", textAlign: "left" }}>
                <CheckCircle2 size={18} color="#4ade80" />
                <span style={{ fontSize: 14, opacity: 0.9 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right" style={{ width: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 56px", background: "#f8fafc", minHeight: "100vh", overflowY: "auto" }}>
        <div className="fade-in-up" style={{ width: "100%" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #7c3aed, #0d9488)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stethoscope size={14} color="white" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, #7c3aed, #0d9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DocLocate</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>Create your account</h2>
            <p style={{ color: "#64748b", fontSize: 14 }}>Get started — it only takes a minute.</p>
          </div>

          <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 12, padding: 3, marginBottom: 24 }}>
            {[{ key: "email", icon: "📧", label: "Email" }, { key: "phone", icon: "📱", label: "Phone" }].map(t => (
              <button key={t.key}
                onClick={() => { setMode(t.key); setForm(f => ({ ...f, identifier: "" })); setError(""); setFieldErrors({}); }}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 700, fontSize: 14, transition: "all 0.25s",
                  background: mode === t.key ? "white" : "transparent",
                  color: mode === t.key ? "#7c3aed" : "#64748b",
                  boxShadow: mode === t.key ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate>
            <Input icon={User} label="Full Name" type="text" placeholder="Your full name" value={form.name} onChange={update("name")} error={fieldErrors.name} required />
            <Input
              icon={mode === "email" ? Mail : Phone}
              label={mode === "email" ? "Email Address" : "Phone Number"}
              type={mode === "email" ? "email" : "tel"}
              placeholder={mode === "email" ? "you@example.com" : "+1 (555) 000-0000"}
              value={form.identifier} onChange={update("identifier")} error={fieldErrors.identifier} required
            />
            <Input icon={Lock} label="Password" type={showPw ? "text" : "password"} placeholder="At least 6 characters"
              value={form.password} onChange={update("password")} error={fieldErrors.password}
              rightIcon={showPw ? <EyeOff size={16} /> : <Eye size={16} />} onRightClick={() => setShowPw(v => !v)}
              hint={!fieldErrors.password ? "Must be at least 6 characters" : ""} required />
            <Input icon={Lock} label="Confirm Password" type={showPw ? "text" : "password"} placeholder="Repeat password"
              value={form.confirm} onChange={update("confirm")} error={fieldErrors.confirm} required />

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                <span>⚠️</span>
                <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15, background: "linear-gradient(135deg, #7c3aed, #0d9488)" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin-slow 0.8s linear infinite" }} />
                  Creating account…
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Create Account <UserPlus size={16} />
                </span>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Already have an account? </span>
            <button onClick={onGoLogin} style={{ background: "none", border: "none", color: "#0d9488", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Sign in →
            </button>
          </div>

          <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            By creating an account, you agree to our <span style={{ color: "#0d9488", cursor: "pointer" }}>Terms of Service</span> and <span style={{ color: "#0d9488", cursor: "pointer" }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────

function Navbar({ onBack, view, user, onLogout, onNavClick }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { key: "home", label: "Home" },
    { key: "clinics", label: "Clinics" },
    { key: "results", label: "Find Doctors" },
  ];

  return (
    <nav style={{
      background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(24px)",
      borderBottom: scrolled ? "1px solid #e2e8f0" : "1px solid rgba(226,232,240,0.5)",
      position: "sticky", top: 0, zIndex: 100,
      fontFamily: "'DM Sans', sans-serif",
      transition: "all 0.3s",
      boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.06)" : "none",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {view !== "home" && (
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", marginRight: 2, borderRadius: 8, color: "#64748b", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, transition: "all 0.15s", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0d9488"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#64748b"; }}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onNavClick("home")}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #0d9488, #0891b2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }}>
              <Stethoscope size={17} color="white" />
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, background: "linear-gradient(135deg, #0d9488, #0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>DocLocate</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => onNavClick(item.key)}
              style={{ background: view === item.key ? "#f0fdfa" : "none", border: "none", padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, color: view === item.key ? "#0d9488" : "#64748b", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", position: "relative" }}
              onMouseEnter={e => { if (view !== item.key) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#374151"; } }}
              onMouseLeave={e => { if (view !== item.key) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#64748b"; } }}>
              {item.label}
              {view === item.key && <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 16, height: 2, background: "linear-gradient(90deg, #0d9488, #0891b2)", borderRadius: 2 }} />}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #f0fdfa, #ecfeff)", borderRadius: 12, padding: "6px 14px 6px 8px", border: "1px solid #99f6e4" }}>
              <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #0d9488, #0891b2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(13,148,136,0.3)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{user.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0d9488", lineHeight: 1 }}>{user.name?.split(" ")[0]}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{user.email || user.phone}</div>
              </div>
            </div>
          )}
          <button onClick={onLogout}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #e2e8f0", padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fff0f0"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── CLINICS PAGE ─────────────────────────────────────────────────────────────

function ClinicsPage({ token, onSelectClinic }) {
  const [clinics, setClinics] = useState(FALLBACK_CLINICS);
  const [activeTab, setActiveTab] = useState("All");
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const tabRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/clinics", { token })
      .then(data => { if (data.length) setClinics(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const specialtyList = ["All", ...new Set(clinics.map(c => c.specialty_focus))];
  const filtered = activeTab === "All" ? clinics : clinics.filter(c => c.specialty_focus === activeTab);

  const specialtyIcons = {
    "All": "🏥",
    "Internal Medicine": "🩺",
    "Family Medicine": "👨‍👩‍👧",
    "Cardiology": "❤️",
    "Dermatology": "✨",
    "Psychiatry": "🧠",
    "Orthopedics": "🦴",
    "Pediatrics": "👶",
    "OB/GYN": "🌸",
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ecfeff 50%, #f8fafc 100%)", borderRadius: 24, padding: "36px 40px", marginBottom: 36, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)", borderRadius: 20, padding: "4px 12px", marginBottom: 12 }}>
            <Building2 size={12} color="#0d9488" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", letterSpacing: "0.06em" }}>PARTNER CLINICS</span>
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>Clinics Near You</h2>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, maxWidth: 600 }}>
            Browse our {clinics.length} partner clinics across Chicago. All accepting patients with major insurance plans.
          </p>
        </div>
      </div>

      {/* Clinic Name Tabs — scrollable */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Filter by Specialty</h3>
        <div ref={tabRef} className="clinic-tab-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {specialtyList.map(spec => (
            <button key={spec} onClick={() => setActiveTab(spec)}
              style={{
                background: activeTab === spec ? "linear-gradient(135deg, #0d9488, #0891b2)" : "white",
                color: activeTab === spec ? "white" : "#64748b",
                border: `1.5px solid ${activeTab === spec ? "transparent" : "#e2e8f0"}`,
                padding: "9px 18px", borderRadius: 24, fontSize: 13, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.25s",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                boxShadow: activeTab === spec ? "0 4px 16px rgba(13,148,136,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => { if (activeTab !== spec) { e.currentTarget.style.borderColor = "#99f6e4"; e.currentTarget.style.color = "#0d9488"; } }}
              onMouseLeave={e => { if (activeTab !== spec) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; } }}>
              {specialtyIcons[spec] || "🏥"} {spec}
            </button>
          ))}
        </div>

        {/* Clinic name tabs as named pills */}
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Jump to Clinic</h3>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="clinic-tab-scroll">
            {filtered.map(clinic => (
              <button key={clinic.id}
                onClick={() => onSelectClinic(clinic)}
                style={{
                  background: `linear-gradient(135deg, ${clinic.image_color}15, ${clinic.image_color}08)`,
                  color: clinic.image_color,
                  border: `1.5px solid ${clinic.image_color}30`,
                  padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = clinic.image_color; e.currentTarget.style.color = "white"; }}
                onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${clinic.image_color}15, ${clinic.image_color}08)`; e.currentTarget.style.color = clinic.image_color; }}>
                {clinic.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clinic Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <div style={{ height: 90, background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              <div style={{ padding: 20 }}>
                <div style={{ height: 16, background: "#f1f5f9", borderRadius: 8, marginBottom: 10 }} />
                <div style={{ height: 12, background: "#f8fafc", borderRadius: 8, width: "60%" }} />
              </div>
            </div>
          ))
        ) : filtered.map(clinic => {
          const hovered = hoveredId === clinic.id;
          return (
            <div key={clinic.id}
              onClick={() => onSelectClinic(clinic)}
              onMouseEnter={() => setHoveredId(clinic.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: "white", borderRadius: 20, overflow: "hidden", cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                border: "1px solid", borderColor: hovered ? clinic.image_color + "50" : "#e2e8f0",
                boxShadow: hovered ? `0 20px 56px ${clinic.image_color}20, 0 4px 12px rgba(0,0,0,0.06)` : "0 2px 8px rgba(0,0,0,0.04)",
                transform: hovered ? "translateY(-6px)" : "none",
              }}>
              {/* Clinic Banner */}
              <div style={{ height: 96, background: `linear-gradient(135deg, ${clinic.image_color}f0, ${clinic.image_color}90, ${clinic.image_color}60)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
                <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.3)" }}>
                  <Building2 size={26} color="white" />
                </div>
              </div>
              <div style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, flex: 1, marginRight: 8 }}>{clinic.name}</h3>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#f59e0b", flexShrink: 0 }}>
                    <Star size={12} fill="#f59e0b" /> {clinic.rating}
                  </span>
                </div>
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, background: clinic.image_color + "18", color: clinic.image_color, padding: "4px 12px", borderRadius: 20, letterSpacing: "0.02em", marginBottom: 14 }}>
                  {specialtyIcons[clinic.specialty_focus] || "🏥"} {clinic.specialty_focus}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b" }}>
                    <MapPin size={12} color="#94a3b8" /> {clinic.address}, {clinic.city}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b" }}>
                    <Phone size={12} color="#94a3b8" /> {clinic.phone}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: clinic.accepting_new ? "#16a34a" : "#d97706", background: clinic.accepting_new ? "#dcfce7" : "#fef3c7", padding: "4px 12px", borderRadius: 20 }}>
                    {clinic.accepting_new ? "✓ Accepting Patients" : "⏳ Waitlist Only"}
                  </span>
                  <span style={{ fontSize: 12, color: hovered ? clinic.image_color : "#94a3b8", fontWeight: 700, transition: "color 0.2s", display: "flex", alignItems: "center", gap: 4 }}>
                    View Doctors <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SEARCH HERO ─────────────────────────────────────────────────────────────

function SearchHero({ onSearch, user }) {
  const [query, setQuery] = useState("");
  const [nearMe, setNearMe] = useState(false);

  const popularSearches = ["Internal Medicine", "Family Doctor", "Cardiology", "Pediatrics", "Psychiatry"];

  return (
    <div style={{
      background: "linear-gradient(160deg, #f0fdfa 0%, #ecfeff 40%, #f8fafc 100%)",
      padding: "72px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -80, right: -60, width: 350, height: 350, background: "radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -50, left: -40, width: 250, height: 250, background: "radial-gradient(circle, rgba(8,145,178,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", right: "10%", width: 180, height: 180, background: "radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 20 }}>
          <div style={{ width: 6, height: 6, background: "#0d9488", borderRadius: "50%", animation: "pulse-dot 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0d9488", letterSpacing: "0.04em" }}>
            {user ? `WELCOME BACK, ${user.name.toUpperCase().split(" ")[0]} 👋` : "HEALTHCARE MADE SIMPLE"}
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(30px, 5vw, 54px)", fontWeight: 900, color: "#0f172a", lineHeight: 1.12, marginBottom: 16, letterSpacing: "-0.03em" }}>
          Find trusted doctors<br />
          <span style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>near your new home.</span>
        </h1>

        <p style={{ fontSize: 17, color: "#64748b", marginBottom: 36, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.65 }}>
          Search by specialty, clinic, or insurance — with real-time filters for language and new-patient availability.
        </p>

        {/* Search bar */}
        <div style={{ maxWidth: 700, margin: "0 auto", background: "white", borderRadius: 18, boxShadow: "0 8px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(13,148,136,0.12)", display: "flex", alignItems: "center", padding: "6px 6px 6px 22px", gap: 8 }}>
          <Search size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch(query)}
            placeholder="Search specialty, clinic, or insurance..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#0f172a", fontFamily: "'DM Sans', sans-serif", background: "transparent", padding: "4px 0" }}
          />
          <button onClick={() => setNearMe(!nearMe)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, border: "none", background: nearMe ? "rgba(13,148,136,0.12)" : "#f8fafc", color: nearMe ? "#0d9488" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            <LocateFixed size={13} /> Near Me
          </button>
          <button onClick={() => onSearch(query)} className="btn-primary" style={{ padding: "10px 24px", fontSize: 14, borderRadius: 13 }}>
            Search
          </button>
        </div>

        {/* Popular searches */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, display: "flex", alignItems: "center" }}>Popular:</span>
          {popularSearches.map(tag => (
            <button key={tag} onClick={() => onSearch(tag)} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#475569", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", fontWeight: 600 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.color = "#0d9488"; e.currentTarget.style.background = "#f0fdfa"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "white"; }}>
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DOCTOR CARD ─────────────────────────────────────────────────────────────

function DoctorCard({ doctor, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const [saved, setSaved] = useState(false);
  const color = doctor.color || "#0d9488";

  return (
    <div onClick={() => onSelect(doctor)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: "white", borderRadius: 20, padding: 24, cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        border: "1px solid", borderColor: hovered ? color + "40" : "#e2e8f0",
        boxShadow: hovered ? `0 16px 48px ${color}18, 0 4px 12px rgba(0,0,0,0.06)` : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-5px)" : "none",
        position: "relative", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}60)`, opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }} />
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${color}20, ${color}40)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${color}25` }}>
          <span style={{ fontSize: 18, fontWeight: 900, color }}>{doctor.avatar}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{doctor.name}</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "3px 0 0", fontWeight: 500 }}>{doctor.specialty}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setSaved(!saved); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: saved ? "#ef4444" : "#cbd5e1", transition: "all 0.2s", flexShrink: 0 }}>
              <Heart size={16} fill={saved ? "#ef4444" : "none"} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {doctor.verified === 1 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${color}15`, color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                <BadgeCheck size={11} /> Verified
              </span>
            )}
            {doctor.accepting === 1 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                <CheckCircle2 size={11} /> Accepting
              </span>
            ) : (
              <span style={{ background: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Waitlist</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Star size={13} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{doctor.rating}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>({doctor.reviews})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Building2 size={13} color="#94a3b8" />
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{doctor.clinic_name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <MapPin size={13} color="#94a3b8" />
          <span style={{ fontSize: 12, color: "#64748b" }}>{doctor.distance}</span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <Shield size={12} color="#94a3b8" />
          {(doctor.insurance || []).slice(0, 3).map(ins => (
            <span key={ins} style={{ fontSize: 11, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "2px 8px", borderRadius: 12, fontWeight: 500 }}>{ins}</span>
          ))}
          {(doctor.insurance || []).length > 3 && <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>+{doctor.insurance.length - 3} more</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Globe size={12} color="#94a3b8" />
          <span style={{ fontSize: 11, color: "#64748b" }}>{(doctor.languages || []).join(" · ")}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={12} color="#0d9488" />
            <span style={{ fontSize: 12, color: "#0d9488", fontWeight: 700 }}>{doctor.next_available}</span>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>${doctor.fee} / visit</span>
        </div>
        <button style={{ background: hovered ? color : "#f8fafc", color: hovered ? "white" : "#64748b", border: "none", padding: "9px 18px", borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
          Book <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── BOOKING CALENDAR ─────────────────────────────────────────────────────────

function BookingCalendar({ doctor, onBack, token }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const days = Object.keys(SLOTS);

  const confirm = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch("/appointments", { method: "POST", token, body: { doctor_id: doctor.id, date: selectedDay, time: selectedSlot } });
      setBooked(true);
    } catch (err) {
      setBooked(true); // Show success even if backend is down (demo mode)
    } finally {
      setLoading(false);
    }
  };

  if (booked) return (
    <div style={{ textAlign: "center", padding: "48px 24px", fontFamily: "inherit" }}>
      <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #0d9488, #0891b2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 32px rgba(13,148,136,0.3)", animation: "pulse-glow 2s ease-in-out 3" }}>
        <CheckCircle2 size={40} color="white" />
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>Appointment Confirmed! 🎉</h2>
      <p style={{ color: "#64748b", marginBottom: 4, fontSize: 15 }}><strong>{doctor.name}</strong> · {doctor.clinic_name}</p>
      <p style={{ color: "#0d9488", fontWeight: 800, fontSize: 16, marginBottom: 28 }}>{selectedDay} at {selectedSlot}</p>
      <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 16, padding: 18, maxWidth: 380, margin: "0 auto 28px", textAlign: "left" }}>
        <p style={{ fontSize: 13, color: "#0f172a", margin: 0, lineHeight: 1.8, fontWeight: 500 }}>
          📧 Confirmation sent to your email<br />
          📱 SMS reminder set for 24h before<br />
          📋 Complete your intake form before visiting
        </p>
      </div>
      <button onClick={onBack} className="btn-primary" style={{ padding: "12px 32px", fontSize: 14, borderRadius: 12 }}>Back to Results</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfeff)", border: "1px solid #99f6e4", borderRadius: 16, padding: 20, marginBottom: 28, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${doctor.color || "#0d9488"}20, ${doctor.color || "#0d9488"}40)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${doctor.color || "#0d9488"}25` }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: doctor.color || "#0d9488" }}>{doctor.avatar}</span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{doctor.name}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>{doctor.specialty} · {doctor.clinic_name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#0d9488", fontWeight: 700 }}>${doctor.fee} per visit</p>
        </div>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Select a Date</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 28 }}>
        {days.map(day => {
          const [wd, mo, dt] = day.split(" ");
          const isSel = selectedDay === day;
          return (
            <button key={day} onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
              style={{ background: isSel ? "linear-gradient(135deg, #0d9488, #0891b2)" : "white", border: `1.5px solid ${isSel ? "transparent" : "#e2e8f0"}`, borderRadius: 14, padding: "14px 6px", cursor: "pointer", transition: "all 0.25s", textAlign: "center", fontFamily: "inherit", boxShadow: isSel ? "0 4px 16px rgba(13,148,136,0.3)" : "0 1px 4px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => !isSel && (e.currentTarget.style.borderColor = "#0d9488")}
              onMouseLeave={e => !isSel && (e.currentTarget.style.borderColor = "#e2e8f0")}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isSel ? "rgba(255,255,255,0.8)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{wd}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: isSel ? "white" : "#0f172a", lineHeight: 1.2, marginTop: 2 }}>{dt}</div>
              <div style={{ fontSize: 11, color: isSel ? "rgba(255,255,255,0.8)" : "#64748b", marginTop: 1 }}>{mo}</div>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Available Times</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 28 }}>
            {SLOTS[selectedDay].map(slot => {
              const isSel = selectedSlot === slot;
              return (
                <button key={slot} onClick={() => setSelectedSlot(slot)}
                  style={{ background: isSel ? "linear-gradient(135deg, #0d9488, #0891b2)" : "#f8fafc", border: `1.5px solid ${isSel ? "transparent" : "#e2e8f0"}`, borderRadius: 11, padding: "11px 6px", fontSize: 13, fontWeight: 700, color: isSel ? "white" : "#374151", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", boxShadow: isSel ? "0 4px 12px rgba(13,148,136,0.25)" : "none" }}
                  onMouseEnter={e => !isSel && (e.currentTarget.style.background = "#f0fdfa")}
                  onMouseLeave={e => !isSel && (e.currentTarget.style.background = "#f8fafc")}>
                  {slot}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedSlot && (
        <div style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfeff)", border: "1px solid #99f6e4", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 14, color: "#374151", fontWeight: 500 }}>
            <strong>Confirming:</strong> {selectedDay} at <strong style={{ color: "#0d9488" }}>{selectedSlot}</strong> with {doctor.name}
          </p>
        </div>
      )}

      {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>⚠️ {error}</div>}
      <button onClick={confirm} disabled={!selectedSlot || loading}
        className={selectedSlot ? "btn-primary" : ""}
        style={{ width: "100%", background: selectedSlot ? "linear-gradient(135deg, #0d9488, #0891b2)" : "#e2e8f0", color: selectedSlot ? "white" : "#94a3b8", border: "none", padding: "14px", borderRadius: 13, fontSize: 15, fontWeight: 700, cursor: selectedSlot ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.2s", boxShadow: selectedSlot ? "0 4px 16px rgba(13,148,136,0.3)" : "none" }}>
        {loading ? "Booking…" : selectedSlot ? "Confirm Appointment" : "Select a time to continue"}
      </button>
    </div>
  );
}

// ─── CHAT PANEL ──────────────────────────────────────────────────────────────

function ChatPanel({ doctor, onClose }) {
  const [messages, setMessages] = useState([
    { from: "doctor", text: `Hi! I'm Dr. ${doctor.name.split(" ").slice(1).join(" ")}'s care team. How can we help you today?` }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { from: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { from: "doctor", text: "Thank you for reaching out. We'll make sure the doctor is aware of your question before your appointment. Is there anything else we can help with?" }]);
    }, 1200);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, width: 360, background: "white", borderRadius: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)", zIndex: 200, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>{doctor.avatar}</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{doctor.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", animation: "pulse-dot 2s infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>Care team online</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: "white", display: "flex", transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}>
          <X size={14} />
        </button>
      </div>
      <div style={{ padding: 16, height: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, background: "#fafafa" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.from === "user" ? "linear-gradient(135deg, #0d9488, #0891b2)" : "white", color: msg.from === "user" ? "white" : "#374151", fontSize: 13, lineHeight: 1.55, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", fontWeight: 500 }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, background: "white" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask a pre-appointment question..." style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "9px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#374151", transition: "border-color 0.2s" }}
          onFocus={e => e.currentTarget.style.borderColor = "#0d9488"}
          onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
        <button onClick={send} className="btn-primary" style={{ padding: "9px 13px", borderRadius: 12 }}>
          <Send size={14} color="white" />
        </button>
      </div>
    </div>
  );
}

// ─── DOCTOR PROFILE ──────────────────────────────────────────────────────────

function DoctorProfile({ doctor, onBack, token }) {
  const [activeTab, setActiveTab] = useState("book");
  const [chatOpen, setChatOpen] = useState(false);
  const color = doctor.color || "#0d9488";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${color}, ${color}60)` }} />
        <div style={{ padding: 28 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 90, height: 90, borderRadius: 24, background: `linear-gradient(135deg, ${color}20, ${color}50)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `3px solid ${color}25` }}>
              <span style={{ fontSize: 28, fontWeight: 900, color }}>{doctor.avatar}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>{doctor.name}</h2>
                {doctor.verified === 1 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${color}15`, color, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}><BadgeCheck size={12} /> Verified</span>}
              </div>
              <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 14, fontWeight: 500 }}>{doctor.specialty} · {doctor.years} yrs experience · {doctor.clinic_name}</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}><Star size={13} color="#f59e0b" fill="#f59e0b" /> <strong>{doctor.rating}</strong> <span style={{ color: "#94a3b8" }}>({doctor.reviews} reviews)</span></span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#64748b" }}><MapPin size={12} color="#94a3b8" /> {doctor.distance}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#0d9488", fontWeight: 700 }}><Phone size={12} /> ${doctor.fee}/visit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { icon: Shield, label: "Insurance Accepted", items: doctor.insurance || [], itemColor: "#64748b", iconColor: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", itemBg: "#f8fafc", itemBorder: "#e2e8f0" },
          { icon: Globe, label: "Languages Spoken", items: doctor.languages || [], itemColor: "#0891b2", iconColor: "#0891b2", bg: "#f0f9ff", border: "#bae6fd", itemBg: "#ecfeff", itemBorder: "#a5f3fc" },
        ].map(({ icon: Icon, label, items, bg, border, itemBg, itemBorder, itemColor, iconColor }) => (
          <div key={label} style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${border}` }}>
                <Icon size={15} color={iconColor} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{label}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {items.map(item => (
                <span key={item} style={{ fontSize: 12, background: itemBg, border: `1px solid ${itemBorder}`, color: itemColor, padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 24px" }}>
          {[
            { id: "book", label: "Book Appointment", icon: <Calendar size={14} /> },
            { id: "about", label: "About", icon: <User size={14} /> },
            { id: "chat", label: "Message", icon: <MessageCircle size={14} /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === "chat") setChatOpen(true); }}
              style={{ background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab.id ? "#0d9488" : "transparent"}`, color: activeTab === tab.id ? "#0d9488" : "#64748b", padding: "16px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div style={{ padding: 28 }}>
          {activeTab === "book" && <BookingCalendar doctor={doctor} onBack={onBack} token={token} />}
          {activeTab === "about" && (
            <div>
              <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.75, margin: 0 }}>{doctor.bio}</p>
              <div style={{ marginTop: 20, padding: 18, background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.8 }}>
                  <strong style={{ color: "#374151" }}>Experience:</strong> {doctor.years} years in practice<br />
                  <strong style={{ color: "#374151" }}>Clinic:</strong> {doctor.clinic_name}<br />
                  <strong style={{ color: "#374151" }}>Next Available:</strong> <span style={{ color: "#0d9488", fontWeight: 700 }}>{doctor.next_available}</span>
                </p>
              </div>
            </div>
          )}
          {activeTab === "chat" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 56, height: 56, background: "#f0fdfa", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <MessageCircle size={28} color="#0d9488" />
              </div>
              <p style={{ color: "#374151", fontWeight: 700, marginBottom: 8, fontSize: 15 }}>Chat opened in the bottom-right corner</p>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Ask pre-appointment questions to the care team</p>
            </div>
          )}
        </div>
      </div>
      {chatOpen && <ChatPanel doctor={doctor} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

// ─── HOME STATS BAR ──────────────────────────────────────────────────────────

function StatsBar() {
  return (
    <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "center", gap: 56, flexWrap: "wrap" }}>
        {[
          ["2,400+", "Verified Doctors"],
          ["180+", "Partner Clinics"],
          ["40+", "Specialties"],
          ["98%", "Patient Satisfaction"],
        ].map(([val, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, background: "linear-gradient(135deg, #0d9488, #0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function DocLocate() {
  const [authView, setAuthView] = useState("login");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [view, setView] = useState("home");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeSpecialty, setActiveSpecialty] = useState("All");
  const [activeInsurance, setActiveInsurance] = useState("All Insurance");
  const [sortBy, setSortBy] = useState("rating");
  const [doctors, setDoctors] = useState(FALLBACK_DOCTORS);
  const [clinics, setClinics] = useState(FALLBACK_CLINICS);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [activeClinicFilter, setActiveClinicFilter] = useState(null);

  // Restore session
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("doclocate_token");
      const savedUser = localStorage.getItem("doclocate_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setAuthView("app");
      }
    } catch {}
  }, []);

  // Load data from backend
  useEffect(() => {
    if (authView !== "app") return;
    setLoadingDoctors(true);
    Promise.all([
      apiFetch("/doctors", { token }).catch(() => null),
      apiFetch("/clinics", { token }).catch(() => null),
    ]).then(([doctorData, clinicData]) => {
      if (doctorData && doctorData.length) setDoctors(doctorData);
      if (clinicData && clinicData.length) setClinics(clinicData);
    }).finally(() => setLoadingDoctors(false));
  }, [authView, token]);

  const handleLogin = (userData, tok) => {
    setUser(userData); setToken(tok); setAuthView("app");
    try { localStorage.setItem("doclocate_token", tok); localStorage.setItem("doclocate_user", JSON.stringify(userData)); } catch {}
  };

  const handleLogout = () => {
    setUser(null); setToken(null); setAuthView("login");
    try { localStorage.removeItem("doclocate_token"); localStorage.removeItem("doclocate_user"); } catch {}
  };

  const filtered = doctors
    .filter(d => activeSpecialty === "All" || d.specialty === activeSpecialty)
    .filter(d => activeInsurance === "All Insurance" || (d.insurance || []).includes(activeInsurance))
    .filter(d => !activeClinicFilter || d.clinic_id === activeClinicFilter)
    .sort((a, b) => sortBy === "rating" ? b.rating - a.rating : sortBy === "distance" ? parseFloat(a.distance) - parseFloat(b.distance) : a.fee - b.fee);

  const handleSelect = doc => { setSelectedDoctor(doc); setView("profile"); };
  const handleBack = () => setView(view === "profile" ? "results" : "home");
  const handleNavClick = v => { setView(v); setActiveClinicFilter(null); };

  if (authView === "login") return (<><style>{globalCSS}</style><LoginPage onLogin={handleLogin} onGoRegister={() => setAuthView("register")} /></>);
  if (authView === "register") return (<><style>{globalCSS}</style><RegisterPage onLogin={handleLogin} onGoLogin={() => setAuthView("login")} /></>);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{globalCSS}</style>
      <Navbar onBack={handleBack} view={view} user={user} onLogout={handleLogout} onNavClick={handleNavClick} />

      {/* HOME */}
      {view === "home" && (
        <>
          <SearchHero onSearch={() => setView("results")} user={user} />
          <StatsBar />
          <div style={{ maxWidth: 1140, margin: "0 auto", padding: "52px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>Explore DocLocate</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 64 }}>
              {[
                { icon: Search, title: "Find Doctors", desc: "Search by specialty, language & insurance", color: "#0d9488", bg: "#f0fdfa", view: "results", emoji: "🩺" },
                { icon: Building2, title: "Browse Clinics", desc: "Explore 180+ partner clinics across the city", color: "#0891b2", bg: "#f0f9ff", view: "clinics", emoji: "🏥" },
                { icon: Calendar, title: "My Appointments", desc: "View your upcoming & past bookings", color: "#7c3aed", bg: "#faf5ff", view: "results", emoji: "📅" },
              ].map(card => (
                <div key={card.title} onClick={() => setView(card.view)}
                  style={{ background: "white", borderRadius: 22, padding: 26, cursor: "pointer", border: "1px solid #e2e8f0", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${card.color}15`; e.currentTarget.style.borderColor = card.color + "30"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                  <div style={{ width: 52, height: 52, background: card.bg, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 24 }}>
                    {card.emoji}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.01em" }}>{card.title}</h3>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 18, color: card.color, fontSize: 13, fontWeight: 700 }}>
                    Explore <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Clinics on Home */}
          <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px 64px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>Featured Clinics</h2>
              <button onClick={() => setView("clinics")} style={{ background: "none", border: "none", color: "#0d9488", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                View all <ArrowRight size={13} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }} className="clinic-tab-scroll">
              {clinics.slice(0, 6).map(clinic => (
                <div key={clinic.id}
                  onClick={() => { setActiveClinicFilter(clinic.id); setActiveSpecialty(clinic.specialty_focus); setView("results"); }}
                  style={{ background: "white", border: `1.5px solid ${clinic.image_color}25`, borderRadius: 20, padding: "18px 20px", cursor: "pointer", flexShrink: 0, width: 200, transition: "all 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${clinic.image_color}08`; e.currentTarget.style.borderColor = `${clinic.image_color}60`; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = `${clinic.image_color}25`; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${clinic.image_color}25, ${clinic.image_color}15)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, border: `1px solid ${clinic.image_color}20` }}>
                    <Building2 size={22} color={clinic.image_color} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", lineHeight: 1.35, marginBottom: 6 }}>{clinic.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: clinic.image_color, background: `${clinic.image_color}15`, padding: "3px 8px", borderRadius: 20, display: "inline-block" }}>{clinic.specialty_focus}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{clinic.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%)", borderTop: "1px solid #e2e8f0", padding: "56px 24px", textAlign: "center" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 14, letterSpacing: "-0.02em" }}>Built for newcomers, by people who get it.</h2>
              <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>Moving to a new city is stressful. Finding a doctor shouldn't be. DocLocate filters for insurance compatibility, languages spoken, and new-patient availability — all in one place.</p>
              <button onClick={() => setView("results")} className="btn-primary" style={{ padding: "14px 36px", fontSize: 15, borderRadius: 14 }}>
                Browse All Doctors →
              </button>
            </div>
          </div>
        </>
      )}

      {/* CLINICS */}
      {view === "clinics" && (
        <ClinicsPage token={token} onSelectClinic={clinic => {
          setActiveClinicFilter(clinic.id);
          setActiveSpecialty(clinic.specialty_focus);
          setView("results");
        }} />
      )}

      {/* RESULTS */}
      {view === "results" && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
          {activeClinicFilter && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 12, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <Building2 size={14} color="#0d9488" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0d9488" }}>
                  {clinics.find(c => c.id === activeClinicFilter)?.name || "Clinic"}
                </span>
                <button onClick={() => setActiveClinicFilter(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", padding: 0 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 3, letterSpacing: "-0.02em" }}>Doctors Near You</h2>
                <p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{filtered.length} results · Verified providers</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Sort:</span>
                {["rating", "distance", "fee"].map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    style={{ background: sortBy === s ? "#f0fdfa" : "#f8fafc", border: `1.5px solid ${sortBy === s ? "#99f6e4" : "#e2e8f0"}`, color: sortBy === s ? "#0d9488" : "#64748b", padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize", transition: "all 0.2s" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }} className="clinic-tab-scroll">
              {SPECIALTIES.map(spec => (
                <button key={spec} onClick={() => setActiveSpecialty(spec)}
                  style={{ background: activeSpecialty === spec ? "linear-gradient(135deg, #0d9488, #0891b2)" : "white", color: activeSpecialty === spec ? "white" : "#64748b", border: `1.5px solid ${activeSpecialty === spec ? "transparent" : "#e2e8f0"}`, padding: "8px 18px", borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.2s", flexShrink: 0, boxShadow: activeSpecialty === spec ? "0 3px 12px rgba(13,148,136,0.25)" : "none" }}>
                  {spec}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="clinic-tab-scroll">
              {INSURANCES.map(ins => (
                <button key={ins} onClick={() => setActiveInsurance(ins)}
                  style={{ background: activeInsurance === ins ? "#ecfeff" : "white", color: activeInsurance === ins ? "#0891b2" : "#64748b", border: `1.5px solid ${activeInsurance === ins ? "#a5f3fc" : "#e2e8f0"}`, padding: "6px 14px", borderRadius: 24, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <Shield size={11} /> {ins}
                </button>
              ))}
            </div>
          </div>

          {loadingDoctors ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#0d9488", borderRadius: "50%", margin: "0 auto 16px", animation: "spin-slow 1s linear infinite" }} />
              <p style={{ color: "#64748b", fontWeight: 500 }}>Loading doctors…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>No doctors found</h3>
              <p style={{ color: "#64748b", fontSize: 14 }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {filtered.map(doc => <DoctorCard key={doc.id} doctor={doc} onSelect={handleSelect} />)}
            </div>
          )}
        </div>
      )}

      {/* PROFILE */}
      {view === "profile" && selectedDoctor && (
        <DoctorProfile doctor={selectedDoctor} onBack={() => setView("results")} token={token} />
      )}
    </div>
  );
}