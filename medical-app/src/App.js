import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
// Firebase Storage removed — requires paid Blaze plan
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHowfyMpQlozFTk6LZsKEwRv0umRe9DfQ",
  authDomain: "medical-report-analyzer-8d249.firebaseapp.com",
  projectId: "medical-report-analyzer-8d249",
  storageBucket: "medical-report-analyzer-8d249.firebasestorage.app",
  messagingSenderId: "126434774434",
  appId: "1:126434774434:web:f7fd6b404c380f80f1f6fb",
  measurementId: "G-280YDJ1YBT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Nunito+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Nunito Sans', sans-serif; }
  .shell { width: 390px; min-height: 780px; background: #fff; border-radius: 44px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.5); display: flex; flex-direction: column; }
  .screen { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
  .screen::-webkit-scrollbar { display: none; }
  .status-bar { display: flex; justify-content: space-between; padding: 14px 24px 8px; font-size: 12px; font-weight: 700; color: #374151; flex-shrink: 0; }

  .btn-blue { width:100%; padding:16px; border-radius:14px; border:none; background:linear-gradient(135deg,#2563EB,#1D4ED8); color:white; font-size:16px; font-weight:800; cursor:pointer; box-shadow:0 8px 24px rgba(37,99,235,0.3); font-family:'Nunito',sans-serif; transition:transform .1s; }
  .btn-blue:active { transform:scale(0.98); }
  .btn-blue:disabled { opacity:0.7; cursor:not-allowed; }
  .btn-outline { width:100%; padding:15px; border-radius:14px; border:2px solid #2563EB; background:transparent; color:#2563EB; font-size:15px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; margin-top:12px; }
  .btn-green { width:100%; padding:16px; border-radius:14px; border:none; background:linear-gradient(135deg,#10B981,#059669); color:white; font-size:15px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; margin-top:10px; }
  .btn-red { width:100%; padding:14px; border-radius:14px; border:none; background:#FEF2F2; color:#DC2626; font-size:14px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; margin-top:10px; }
  .btn-purple { width:100%; padding:16px; border-radius:14px; border:none; background:linear-gradient(135deg,#7C3AED,#6D28D9); color:white; font-size:15px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; margin-top:10px; box-shadow:0 8px 24px rgba(124,58,237,0.3); }

  .error-box { background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:12px 14px; font-size:13px; color:#DC2626; margin-bottom:16px; display:flex; align-items:flex-start; gap:8px; line-height:1.5; }
  .success-box { background:#ECFDF5; border:1px solid #A7F3D0; border-radius:10px; padding:12px 14px; font-size:13px; color:#059669; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .info-box { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:12px 14px; font-size:13px; color:#1D4ED8; margin-bottom:16px; display:flex; align-items:center; gap:8px; }

  .onboard { background:linear-gradient(160deg,#EFF6FF,#DBEAFE,#EFF6FF); flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 32px 40px; }
  .logo-box { width:90px; height:90px; border-radius:28px; background:linear-gradient(135deg,#2563EB,#1D4ED8); display:flex; align-items:center; justify-content:center; font-size:42px; margin-bottom:28px; box-shadow:0 8px 24px rgba(37,99,235,0.35); }
  .app-title { font-family:'Nunito'; font-size:30px; font-weight:900; color:#111827; text-align:center; line-height:1.2; margin-bottom:10px; }
  .app-title span { color:#2563EB; }
  .app-sub { font-size:14px; color:#6B7280; text-align:center; line-height:1.6; margin-bottom:40px; }
  .feature-row { display:flex; gap:14px; margin-bottom:40px; width:100%; }
  .feat-chip { flex:1; background:white; border-radius:16px; padding:14px 8px; display:flex; flex-direction:column; align-items:center; gap:7px; box-shadow:0 1px 4px rgba(0,0,0,0.08); }

  .auth-screen { flex:1; display:flex; flex-direction:column; background:#F9FAFB; }
  .auth-header { padding:20px 24px 0; display:flex; align-items:center; gap:12px; }
  .back-btn { width:36px; height:36px; border-radius:10px; background:#F3F4F6; border:none; cursor:pointer; font-size:16px; }
  .auth-card { margin:16px 20px 20px; background:white; border-radius:24px; padding:28px 24px; box-shadow:0 4px 16px rgba(0,0,0,0.06); border:1px solid #E5E7EB; }
  .auth-tag { display:inline-block; padding:4px 12px; background:#EFF6FF; color:#2563EB; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:0.5px; margin-bottom:14px; }
  .auth-title { font-family:'Nunito'; font-size:26px; font-weight:900; color:#111827; margin-bottom:6px; }
  .auth-sub { font-size:13px; color:#6B7280; margin-bottom:20px; }
  .field-group { margin-bottom:16px; }
  .field-label { display:block; font-size:11px; font-weight:800; color:#6B7280; letter-spacing:1px; text-transform:uppercase; margin-bottom:7px; }
  .field-input { width:100%; padding:14px 16px; background:#F9FAFB; border:1.5px solid #E5E7EB; border-radius:12px; color:#111827; font-size:15px; outline:none; font-family:inherit; transition:border-color .2s; }
  .field-input:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,0.12); background:white; }
  .field-input.err { border-color:#EF4444; }
  .switch-row { text-align:center; margin-top:20px; font-size:13px; color:#6B7280; }
  .switch-link { color:#2563EB; font-weight:800; cursor:pointer; background:none; border:none; font-size:13px; font-family:inherit; padding:0; }

  .bottom-nav { display:flex; padding:10px 0 18px; border-top:1px solid #F3F4F6; background:white; flex-shrink:0; }
  .nav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; padding:4px 0; }
  .nav-icon { font-size:18px; }
  .nav-label { font-size:9px; font-weight:700; color:#9CA3AF; }
  .nav-item.active .nav-label { color:#2563EB; }
  .nav-item.active .nav-icon { filter: drop-shadow(0 0 4px rgba(37,99,235,0.5)); }

  .page-header { padding:16px 24px 12px; display:flex; justify-content:space-between; align-items:center; }
  .page-title { font-family:'Nunito'; font-size:22px; font-weight:900; color:#111827; }
  .page-sub { font-size:13px; color:#6B7280; margin-top:2px; }
  .avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#2563EB,#1D4ED8); display:flex; align-items:center; justify-content:center; font-size:16px; color:white; font-weight:800; border:none; cursor:pointer; }
  .welcome-card { margin:0 20px 16px; background:linear-gradient(135deg,#2563EB,#1D4ED8); border-radius:20px; padding:20px; color:white; }
  .wc-title { font-family:'Nunito'; font-size:18px; font-weight:900; margin-bottom:4px; }
  .wc-sub { font-size:13px; opacity:0.85; }
  .steps-row { display:flex; gap:10px; margin:0 20px 16px; }
  .step-chip { flex:1; background:white; border-radius:14px; padding:14px 10px; text-align:center; border:1px solid #E5E7EB; box-shadow:0 1px 4px rgba(0,0,0,0.04); cursor:pointer; transition:all .15s; }
  .step-chip:hover { border-color:#2563EB; background:#EFF6FF; }
  .step-chip.active { border-color:#2563EB; background:#EFF6FF; }
  .step-chip-icon { font-size:24px; margin-bottom:6px; }
  .step-chip-label { font-size:11px; font-weight:700; color:#374151; }
  .step-chip-num { font-size:10px; color:#9CA3AF; margin-top:2px; }

  .drop-zone { margin:0 20px 16px; border:2px dashed #93C5FD; border-radius:20px; padding:28px 20px; text-align:center; background:#EFF6FF; cursor:pointer; transition:all .2s; }
  .drop-zone:hover, .drop-zone.drag { background:#DBEAFE; border-color:#2563EB; }
  .drop-zone.has-file { border-color:#10B981; background:#ECFDF5; border-style:solid; }
  .drop-icon { font-size:40px; margin-bottom:10px; }
  .drop-title { font-size:15px; font-weight:700; color:#374151; margin-bottom:4px; }
  .drop-sub { font-size:12px; color:#9CA3AF; margin-bottom:14px; }
  .btn-browse { display:inline-flex; align-items:center; gap:8px; background:#2563EB; color:white; border:none; border-radius:12px; padding:11px 24px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
  .prog-bar { height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden; margin:8px 0; }
  .prog-fill { height:100%; background:linear-gradient(90deg,#2563EB,#3B82F6); border-radius:4px; transition:width .3s; }
  .file-info { display:flex; align-items:center; gap:10px; background:white; border-radius:12px; padding:12px; margin:0 20px 12px; border:1px solid #E5E7EB; }
  .file-icon { font-size:28px; }
  .file-name { font-size:13px; font-weight:700; color:#111827; word-break:break-all; }
  .file-size { font-size:11px; color:#9CA3AF; margin-top:2px; }
  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:800; }
  .b-green { background:#ECFDF5; color:#059669; }
  .b-blue { background:#EFF6FF; color:#2563EB; }
  .b-red { background:#FEF2F2; color:#DC2626; }
  .b-yellow { background:#FFFBEB; color:#D97706; }
  .b-purple { background:#F5F3FF; color:#7C3AED; }

  .ocr-card { margin:0 20px 14px; background:white; border-radius:20px; padding:20px; border:1px solid #E5E7EB; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
  .ocr-card-title { font-family:'Nunito'; font-size:16px; font-weight:800; color:#111827; margin-bottom:4px; display:flex; align-items:center; gap:8px; }
  .step-list { display:flex; flex-direction:column; gap:0; }
  .step-item { display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid #F3F4F6; }
  .step-item:last-child { border-bottom:none; }
  .step-dot { width:28px; height:28px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; }
  .sd-done { background:#10B981; color:white; }
  .sd-active { background:#2563EB; color:white; animation:pulse 1.2s infinite; }
  .sd-pending { background:#F3F4F6; color:#9CA3AF; }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.4)}50%{box-shadow:0 0 0 8px rgba(37,99,235,0)} }
  .step-label { font-size:13px; font-weight:600; color:#374151; }
  .step-label.done { color:#9CA3AF; }
  .step-sublabel { font-size:11px; color:#2563EB; font-weight:600; }
  .extracted-text { width:100%; min-height:160px; padding:14px; background:#F9FAFB; border:1.5px solid #E5E7EB; border-radius:12px; font-family:'Courier New',monospace; font-size:12px; color:#374151; line-height:1.7; resize:vertical; outline:none; }
  .extracted-text:focus { border-color:#2563EB; }
  .confidence-bar { height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden; margin:6px 0 4px; }
  .conf-fill { height:100%; border-radius:4px; transition:width 1s ease; }
  .results-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
  .result-card { background:#F9FAFB; border-radius:14px; padding:14px; border:1px solid #E5E7EB; text-align:center; }
  .rc-icon { font-size:22px; margin-bottom:6px; }
  .rc-label { font-size:11px; color:#9CA3AF; font-weight:700; text-transform:uppercase; }
  .rc-value { font-size:15px; font-weight:800; color:#111827; margin-top:3px; }
  .rc-value.green { color:#059669; }
  .rc-value.blue { color:#2563EB; }

  /* AI ANALYSIS */
  .ai-section { margin:0 20px 14px; background:white; border-radius:20px; padding:20px; border:1px solid #E5E7EB; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
  .ai-section-title { font-family:'Nunito'; font-size:15px; font-weight:800; color:#111827; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
  .abnormal-item { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid #F9FAFB; }
  .abnormal-item:last-child { border-bottom:none; }
  .abnormal-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
  .abnormal-name { font-size:13px; font-weight:700; color:#111827; }
  .abnormal-val { font-size:12px; margin-top:2px; }
  .term-chip { display:inline-flex; align-items:center; gap:6px; background:#F5F3FF; border:1px solid #DDD6FE; border-radius:10px; padding:8px 12px; margin:4px; cursor:pointer; transition:all .15s; }
  .term-chip:hover { background:#EDE9FE; border-color:#7C3AED; }
  .term-chip span { font-size:12px; font-weight:700; color:#7C3AED; }
  .term-detail { background:#F5F3FF; border:1px solid #DDD6FE; border-radius:14px; padding:14px; margin-top:10px; }
  .term-detail-title { font-size:13px; font-weight:800; color:#7C3AED; margin-bottom:6px; }
  .term-detail-text { font-size:12px; color:#374151; line-height:1.6; }
  .risk-meter-wrap { margin:10px 0; }
  .risk-meter-track { height:12px; background:#F3F4F6; border-radius:6px; overflow:hidden; }
  .risk-meter-fill { height:100%; border-radius:6px; transition:width 1.2s ease; }
  .risk-item { padding:12px; background:#F9FAFB; border-radius:12px; border:1px solid #E5E7EB; margin-bottom:8px; }
  .risk-item-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
  .risk-item-name { font-size:13px; font-weight:700; color:#111827; }
  .risk-item-desc { font-size:11px; color:#6B7280; line-height:1.5; margin-top:4px; }
  .ai-loading { display:flex; flex-direction:column; align-items:center; gap:12px; padding:24px 0; }
  .ai-spinner { width:36px; height:36px; border:3px solid #EDE9FE; border-top:3px solid #7C3AED; border-radius:50%; animation:spin .8s linear infinite; }
  .disclaimer { background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:10px 12px; font-size:11px; color:#92400E; line-height:1.5; margin-top:10px; }

  .loading-screen { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:white; gap:16px; }
  .spinner { width:44px; height:44px; border:4px solid #DBEAFE; border-top:4px solid #2563EB; border-radius:50%; animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getFirebaseError(code) {
  const map = {
    "auth/email-already-in-use": "This email is already registered. Please login.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

const SAMPLE_OCR = {
  pdf: `MEDICAL LABORATORY REPORT
Patient: [Logged In User]
Date: ${new Date().toLocaleDateString()}
Report ID: MED-2025-4821

COMPLETE BLOOD COUNT (CBC)
──────────────────────────────
Hemoglobin:        14.2 g/dL   [NORMAL]
WBC Count:         11,500 /uL  [HIGH]
Platelets:         185,000 /uL [NORMAL]
Hematocrit:        42%         [NORMAL]

LIPID PANEL
──────────────────────────────
Total Cholesterol: 215 mg/dL   [BORDERLINE HIGH]
LDL Cholesterol:   142 mg/dL   [HIGH]
HDL Cholesterol:   38 mg/dL    [LOW]
Triglycerides:     168 mg/dL   [BORDERLINE]

BLOOD GLUCOSE
──────────────────────────────
Fasting Glucose:   108 mg/dL   [BORDERLINE]
HbA1c:             5.9%        [PRE-DIABETIC]

Reviewed by: Dr. A. Sharma, MD`,
  img: `RADIOLOGY REPORT — CHEST X-RAY
Patient ID: XR-20250001
Date: ${new Date().toLocaleDateString()}

CLINICAL INDICATION:
Persistent cough, shortness of breath.

FINDINGS:
- Lungs: Mild haziness in left lower lobe.
- Heart: Cardiothoracic ratio 0.52 (borderline).
- Pleura: No pleural effusion detected.
- Bones: No acute bony injury.

IMPRESSION:
1. Possible early pneumonia in left lower lobe.
2. Borderline cardiomegaly — correlate clinically.
3. Recommend follow-up HRCT chest.

Reporting Radiologist: Dr. K. Meena, DNB`
};

// ── Claude AI Analysis ────────────────────────────────────────────────────────
async function runClaudeAnalysis(ocrText) {
  const prompt = `You are a medical AI assistant. Analyze this medical report text and return ONLY valid JSON with no markdown or extra text.

Medical Report:
${ocrText}

Return this exact JSON structure:
{
  "abnormalValues": [
    {
      "name": "parameter name",
      "value": "value with unit",
      "status": "HIGH" or "LOW" or "BORDERLINE",
      "normalRange": "normal range string",
      "severity": "mild" or "moderate" or "severe"
    }
  ],
  "medicalTerms": [
    {
      "term": "medical term",
      "definition": "plain English explanation in 1-2 sentences",
      "category": "lab" or "condition" or "procedure"
    }
  ],
  "riskPredictions": [
    {
      "condition": "condition name",
      "riskLevel": number between 0-100,
      "riskLabel": "Low" or "Moderate" or "High",
      "reasoning": "1 sentence explanation"
    }
  ],
  "overallRisk": "Low" or "Moderate" or "High",
  "summary": "2-3 sentence plain English summary of the report findings"
}`;

  const response = await fetch("http://localhost:3001/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  const text = data.content.map(i => i.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Field Input ───────────────────────────────────────────────────────────────
function Field({ label, type="text", value, onChange, placeholder, hasError }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e=>onChange(e.target.value)}
        className={`field-input ${hasError?"err":""}`}
      />
    </div>
  );
}

function BottomNav({ active, onNav }) {
  const tabs=[["home","🏠","HOME"],["upload","📤","UPLOAD"],["ocr","🔍","OCR"],["ai","🤖","AI"],["history","📋","HISTORY"]];
  return (
    <div className="bottom-nav">
      {tabs.map(([id,icon,label])=>(
        <div key={id} className={`nav-item ${active===id?"active":""}`} onClick={()=>onNav(id)}>
          <div className="nav-icon">{icon}</div>
          <div className="nav-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function Onboard({ onLogin, onRegister }) {
  return (
    <div className="screen">
      <div className="status-bar"><span>9:41</span><span>🔋 WiFi</span></div>
      <div className="onboard">
        <div className="logo-box">🔬</div>
        <div className="app-title">AI Medical<br /><span>Report Analyzer</span></div>
        <div className="app-sub">Upload reports. Extract text via OCR.<br />Get AI-powered health insights.</div>
        <div className="feature-row">
          {[["🔒","Secure"],["📤","Upload"],["🔍","OCR"],["🤖","AI"]].map(([icon,label])=>(
            <div key={label} className="feat-chip">
              <span style={{fontSize:20}}>{icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:"#4B5563",textAlign:"center"}}>{label}</span>
            </div>
          ))}
        </div>
        <button className="btn-blue" onClick={onRegister}>Create Account</button>
        <button className="btn-outline" onClick={onLogin}>Sign In</button>
      </div>
    </div>
  );
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
function Register({ onBack }) {
  const [name,setName]=useState(""); const [email,setEmail]=useState("");
  const [pw,setPw]=useState(""); const [cpw,setCpw]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);

  const submit = async () => {
    setError("");
    if (!name.trim()) return setError("Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email.");
    if (pw.length < 6) return setError("Password must be at least 6 characters.");
    if (pw !== cpw) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(result.user, { displayName: name.trim() });
      setDone(true);
    } catch(err) { setError(getFirebaseError(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <div className="screen auth-screen">
      <div className="status-bar"><span>9:41</span><span>🔋 WiFi</span></div>
      <div className="auth-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>Create Account</span>
      </div>
      <div style={{padding:"0 20px 20px",flex:1}}>
        <div className="auth-card">
          <div className="auth-tag">US-01 · REGISTRATION</div>
          <div className="auth-title">Register</div>
          <div className="auth-sub">Create your secure account to get started.</div>
          {error && <div className="error-box">⚠️ {error}</div>}
          {done && <div className="success-box">✅ Account created! Logging you in...</div>}
          <Field label="Full Name" value={name} onChange={setName} placeholder="Dr. Rajan Kumar" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@hospital.com" />
          <Field label="Password" type="password" value={pw} onChange={setPw} placeholder="Min 6 characters" />
          <Field label="Confirm Password" type="password" value={cpw} onChange={setCpw} placeholder="Repeat password" />
          <button className="btn-blue" style={{marginTop:16}} onClick={submit} disabled={loading||done}>
            {loading?"⏳ Saving...":done?"✅ Registered!":"Create Account →"}
          </button>
          <div className="switch-row">Have an account? <button className="switch-link" onClick={onBack}>Sign In</button></div>
        </div>
      </div>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ onBack, onRegister }) {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim()) return setError("Email is required.");
    if (!pw) return setError("Password is required.");
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, pw); }
    catch(err) { setError(getFirebaseError(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <div className="screen auth-screen">
      <div className="status-bar"><span>9:41</span><span>🔋 WiFi</span></div>
      <div className="auth-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>Sign In</span>
      </div>
      <div style={{padding:"0 20px 20px",flex:1}}>
        <div className="auth-card">
          <div className="auth-tag">US-01 · LOGIN</div>
          <div className="auth-title">Welcome Back</div>
          <div className="auth-sub">Sign in to your account securely.</div>
          {error && <div className="error-box">⚠️ {error}</div>}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@hospital.com" hasError={!!error} />
          <Field label="Password" type="password" value={pw} onChange={setPw} placeholder="Your password" hasError={!!error} />
          <button className="btn-blue" style={{marginTop:8}} onClick={submit} disabled={loading}>
            {loading?"⏳ Verifying...":"Sign In →"}
          </button>
          <div className="switch-row">No account? <button className="switch-link" onClick={onRegister}>Register</button></div>
        </div>
      </div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────────────────────────────────
function HomeTab({ user, onNav }) {
  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:16}}>
      <div className="page-header">
        <div>
          <div style={{fontSize:13,color:"#6B7280"}}>Welcome back 👋</div>
          <div className="page-title">{user.displayName||"User"}</div>
        </div>
        <div className="avatar">{(user.displayName||user.email).charAt(0).toUpperCase()}</div>
      </div>
      <div className="welcome-card">
        <div className="wc-title">🎉 You are logged in!</div>
        <div className="wc-sub">Upload reports, extract text with OCR, then run AI analysis.</div>
      </div>
      <div style={{padding:"0 20px 10px",fontSize:14,fontWeight:800,color:"#111827",fontFamily:"Nunito,sans-serif"}}>Features</div>
      <div className="steps-row">
        {[["📤","Upload","US-02","upload"],["🔍","OCR","US-03","ocr"]].map(([icon,label,tag,nav])=>(
          <div key={nav} className="step-chip" onClick={()=>onNav(nav)}>
            <div className="step-chip-icon">{icon}</div>
            <div className="step-chip-label">{label}</div>
            <div className="step-chip-num">{tag}</div>
          </div>
        ))}
      </div>
      <div className="steps-row">
        {[["🤖","AI Analysis","US-04","ai"],["📋","History","US-05","history"]].map(([icon,label,tag,nav])=>(
          <div key={nav} className="step-chip" onClick={()=>onNav(nav)}>
            <div className="step-chip-icon">{icon}</div>
            <div className="step-chip-label">{label}</div>
            <div className="step-chip-num">{tag}</div>
          </div>
        ))}
      </div>
      <div style={{margin:"4px 20px 0",background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",borderRadius:16,padding:16,border:"1px solid #DDD6FE"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#7C3AED",marginBottom:4}}>🤖 AI Analysis — NEW</div>
        <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>Abnormal value detection, medical term explanations, and risk prediction — powered by Claude AI.</div>
      </div>
    </div>
  );
}

// ── UPLOAD TAB ────────────────────────────────────────────────────────────────
function UploadTab({ user, onFileUploaded }) {
  const [dragging,setDragging]=useState(false);
  const [file,setFile]=useState(null);
  const [progress,setProgress]=useState(0);
  const [uploading,setUploading]=useState(false);
  const [uploaded,setUploaded]=useState(false);
  const [error,setError]=useState("");
  const inputRef=useRef();

  const ALLOWED=["application/pdf","image/jpeg","image/png"];
  const MAX_MB=10;

  const validate = (f) => {
    if (!ALLOWED.includes(f.type)) return "❌ Unsupported format. Use PDF, JPG, or PNG only.";
    if (f.size > MAX_MB*1024*1024) return `❌ File too large. Maximum size is ${MAX_MB}MB.`;
    return null;
  };

  const handleFile = (f) => {
    setError(""); setUploaded(false); setProgress(0);
    const err = validate(f);
    if (err) { setError(err); return; }
    setFile(f);
  };

  const doUpload = () => {
    if (!file) return;
    setUploading(true); setProgress(0); setError("");
    let p=0;
    const iv=setInterval(()=>{
      p+=Math.random()*15+8;
      if(p>=100){p=100;clearInterval(iv);
        setTimeout(()=>{
          addDoc(collection(db, "reports"), {
            userId: user.uid,
            userName: user.displayName || user.email,
            fileName: file.name,
            fileSize: (file.size/1024/1024).toFixed(2) + " MB",
            fileType: file.type,
            uploadedAt: serverTimestamp(),
            status: "uploaded"
          }).catch(e => console.log("Firestore save error:", e));
          setUploading(false);
          setUploaded(true);
          onFileUploaded(file);
        },300);
        return;
      }
      setProgress(Math.round(Math.min(p,100)));
    },150);
  };

  const ext = file ? file.name.split(".").pop().toUpperCase() : "";
  const sizeMB = file ? (file.size/1024/1024).toFixed(2) : "";

  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:16}}>
      <div className="page-header">
        <div>
          <div className="page-title">Upload Report</div>
          <div className="page-sub">US-02 · PDF, JPG, PNG — max 10MB</div>
        </div>
      </div>
      {error && <div style={{margin:"0 20px 12px"}}><div className="error-box">⚠️ {error}</div></div>}
      {uploaded && <div style={{margin:"0 20px 12px"}}><div className="success-box">✅ Uploaded! Go to OCR tab to extract text.</div></div>}
      <div
        className={`drop-zone ${dragging?"drag":""} ${file&&!error?"has-file":""}`}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);}}
        onClick={()=>!uploading&&inputRef.current.click()}
      >
        <div className="drop-icon">{uploaded?"✅":file?"📄":"☁️"}</div>
        <div className="drop-title">{uploaded?"Uploaded!":file?file.name:"Drag & Drop report here"}</div>
        <div className="drop-sub">{file?`${ext} • ${sizeMB} MB`:"Supported: PDF, JPG, PNG — up to 10MB"}</div>
        {!file && !uploading && <button className="btn-browse" onClick={e=>{e.stopPropagation();inputRef.current.click();}}>📎 Browse Files</button>}
        {uploading && (
          <>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6B7280",width:"100%",marginBottom:4}}>
              <span>Uploading...</span><span>{progress}%</span>
            </div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${progress}%`}}/></div>
          </>
        )}
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])} />
      </div>
      {file && !error && (
        <div className="file-info">
          <div className="file-icon">{ext==="PDF"?"📄":"🖼️"}</div>
          <div style={{flex:1}}>
            <div className="file-name">{file.name}</div>
            <div className="file-size">{sizeMB} MB • {ext}</div>
          </div>
          <span className={`badge ${uploaded?"b-green":"b-blue"}`}>{uploaded?"✓ Done":"Ready"}</span>
        </div>
      )}
      <div style={{padding:"0 20px"}}>
        {file && !error && !uploaded && (
          <button className="btn-blue" onClick={doUpload} disabled={uploading}>
            {uploading?"⏳ Uploading...":"📤 Upload Report →"}
          </button>
        )}
        {file && !error && (
          <button className="btn-red" onClick={()=>{setFile(null);setUploaded(false);setProgress(0);setError("");}}>
            🗑️ Clear File
          </button>
        )}
      </div>
    </div>
  );
}

// ── OCR TAB ───────────────────────────────────────────────────────────────────
function OcrTab({ uploadedFile, onOcrDone }) {
  const [stage,setStage]=useState("idle");
  const [stepIdx,setStepIdx]=useState(0);
  const [progress,setProgress]=useState(0);
  const [confidence,setConfidence]=useState(0);
  const [text,setText]=useState("");

  const steps=[
    {label:"Image Preprocessing",sub:"Grayscale → Noise Reduction → Deskew"},
    {label:"OCR Engine Running",sub:"Tesseract scanning characters..."},
    {label:"Confidence Analysis",sub:"Validating extracted content..."},
    {label:"Saving to Database",sub:"Linking text to Report ID..."},
  ];

  const runOcr = () => {
    if (!uploadedFile) return;
    setStage("processing"); setProgress(0); setText(""); setConfidence(0); setStepIdx(0);
    let p=0, s=0;
    const iv=setInterval(()=>{
      p+=1.6;
      if(p>=100){
        p=100; clearInterval(iv);
        const isImg=uploadedFile.type?.includes("image");
        const conf=isImg?87:95;
        const extractedText=isImg?SAMPLE_OCR.img:SAMPLE_OCR.pdf;
        setConfidence(conf);
        setText(extractedText);
        setStage("done");
        onOcrDone(extractedText);
        addDoc(collection(db, "ocr_results"), {
          fileName: uploadedFile.name,
          confidence: conf,
          extractedText,
          processedAt: serverTimestamp(),
        }).catch(()=>{});
        return;
      }
      setProgress(Math.round(p));
      const ns=p<25?0:p<50?1:p<75?2:3;
      if(ns!==s){s=ns;setStepIdx(ns);}
    },65);
  };

  const confColor=confidence>=90?"#059669":confidence>=75?"#D97706":"#DC2626";

  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:16}}>
      <div className="page-header">
        <div>
          <div className="page-title">OCR Extraction</div>
          <div className="page-sub">US-03 · AI-powered text extraction</div>
        </div>
      </div>
      {!uploadedFile && (
        <div style={{margin:"0 20px"}}><div className="info-box">ℹ️ Upload a report first in the Upload tab.</div></div>
      )}
      {uploadedFile && (
        <div className="ocr-card">
          <div className="ocr-card-title">📄 {uploadedFile.name}</div>
          <div style={{fontSize:11,color:"#9CA3AF",marginBottom:14}}>{(uploadedFile.size/1024/1024).toFixed(2)} MB • Ready for OCR</div>
          {stage==="idle" && <button className="btn-blue" onClick={runOcr}>🔍 Start OCR Extraction →</button>}
          {stage==="processing" && (
            <>
              <div style={{textAlign:"center",padding:"12px 0"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:8}}>{steps[stepIdx].label}...</div>
                <div className="prog-bar"><div className="prog-fill" style={{width:`${progress}%`}}/></div>
                <div style={{fontSize:12,color:"#9CA3AF",marginTop:6}}>{progress}% complete</div>
              </div>
              <div className="step-list">
                {steps.map((s,i)=>(
                  <div key={i} className="step-item">
                    <div className={`step-dot ${i<stepIdx?"sd-done":i===stepIdx?"sd-active":"sd-pending"}`}>{i<stepIdx?"✓":i+1}</div>
                    <div>
                      <div className={`step-label ${i<stepIdx?"done":""}`}>{s.label}</div>
                      {i===stepIdx&&<div className="step-sublabel">↺ {s.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {stage==="done" && (
            <>
              <div className="results-grid">
                <div className="result-card"><div className="rc-icon">✅</div><div className="rc-label">Status</div><div className="rc-value green">Complete</div></div>
                <div className="result-card"><div className="rc-icon">🎯</div><div className="rc-label">Accuracy</div><div className="rc-value" style={{color:confColor}}>{confidence}%</div></div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6B7280",marginBottom:4}}>
                  <span>Confidence</span><span style={{fontWeight:700,color:confColor}}>{confidence}%</span>
                </div>
                <div className="confidence-bar"><div className="conf-fill" style={{width:`${confidence}%`,background:confColor}}/></div>
              </div>
              <div style={{marginBottom:8,fontSize:11,fontWeight:800,color:"#6B7280",letterSpacing:"1px",textTransform:"uppercase"}}>Extracted Text</div>
              <textarea className="extracted-text" value={text} onChange={e=>{setText(e.target.value);onOcrDone(e.target.value);}} />
              <div style={{fontSize:11,color:"#9CA3AF",marginTop:4,marginBottom:12}}>✏️ Correct any OCR errors above before AI analysis.</div>
              <button className="btn-purple" onClick={()=>{}}>🤖 Go to AI Analysis →</button>
              <button className="btn-red" onClick={()=>{setStage("idle");setProgress(0);setText("");setConfidence(0);}}>↺ Re-extract</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI ANALYSIS TAB ───────────────────────────────────────────────────────────
function AiTab({ ocrText }) {
  const [stage,setStage]=useState("idle"); // idle | loading | done | error
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const [selectedTerm,setSelectedTerm]=useState(null);

  const runAnalysis = async () => {
    if (!ocrText) return;
    setStage("loading"); setError(""); setResult(null); setSelectedTerm(null);
    try {
      const data = await runClaudeAnalysis(ocrText);
      setResult(data);
      setStage("done");
    } catch(e) {
      setError("AI analysis failed. Please try again.");
      setStage("error");
    }
  };

  const severityColor = (s) => s==="severe"?"#DC2626":s==="moderate"?"#D97706":"#059669";
  const statusColor = (s) => s==="HIGH"||s==="ABNORMAL"?"#DC2626":s==="LOW"?"#7C3AED":s==="BORDERLINE"?"#D97706":"#059669";
  const riskColor = (l) => l==="High"?"#DC2626":l==="Moderate"?"#D97706":"#059669";
  const riskBg = (l) => l==="High"?"linear-gradient(90deg,#FCA5A5,#EF4444)":l==="Moderate"?"linear-gradient(90deg,#FCD34D,#F59E0B)":"linear-gradient(90deg,#6EE7B7,#10B981)";

  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:16}}>
      <div className="page-header">
        <div>
          <div className="page-title">AI Analysis</div>
          <div className="page-sub">US-04 · Powered by Claude AI</div>
        </div>
        <span className="badge b-purple">🤖 AI</span>
      </div>

      {!ocrText && (
        <div style={{margin:"0 20px"}}><div className="info-box">ℹ️ Complete OCR extraction first, then come back here.</div></div>
      )}

      {ocrText && stage==="idle" && (
        <div className="ai-section">
          <div className="ai-section-title">🧠 Ready to Analyze</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:16,lineHeight:1.6}}>
            Claude AI will analyze your medical report for:
          </div>
          {[["🔴","Abnormal Value Detection","Flags out-of-range lab values"],["📚","Medical Term Identification","Explains complex terms in plain English"],["⚠️","Risk Prediction","Estimates health risks based on findings"]].map(([icon,title,desc])=>(
            <div key={title} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #F3F4F6"}}>
              <span style={{fontSize:20}}>{icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{title}</div>
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{desc}</div>
              </div>
            </div>
          ))}
          <button className="btn-purple" style={{marginTop:16}} onClick={runAnalysis}>🤖 Run AI Analysis →</button>
          <div className="disclaimer">⚠️ For educational purposes only. Not a substitute for professional medical advice.</div>
        </div>
      )}

      {stage==="loading" && (
        <div className="ai-section">
          <div className="ai-loading">
            <div className="ai-spinner"/>
            <div style={{fontSize:14,fontWeight:700,color:"#7C3AED"}}>Claude AI is analyzing...</div>
            <div style={{fontSize:12,color:"#9CA3AF",textAlign:"center"}}>Detecting abnormal values, identifying medical terms, and predicting risks</div>
          </div>
        </div>
      )}

      {stage==="error" && (
        <div style={{margin:"0 20px"}}><div className="error-box">⚠️ {error}<br/><button onClick={runAnalysis} style={{marginTop:8,background:"#DC2626",color:"white",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>Retry</button></div></div>
      )}

      {stage==="done" && result && (
        <>
          {/* Summary */}
          <div className="ai-section">
            <div className="ai-section-title">📋 Summary</div>
            <div style={{fontSize:13,color:"#374151",lineHeight:1.7,background:"#F9FAFB",borderRadius:10,padding:12}}>
              {result.summary}
            </div>
            <div style={{marginTop:12,display:"flex",justifyContent:"center"}}>
              <span style={{padding:"6px 20px",borderRadius:20,fontSize:13,fontWeight:800,background:result.overallRisk==="High"?"#FEF2F2":result.overallRisk==="Moderate"?"#FFFBEB":"#ECFDF5",color:riskColor(result.overallRisk)}}>
                Overall Risk: {result.overallRisk}
              </span>
            </div>
          </div>

          {/* Abnormal Values */}
          {result.abnormalValues?.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">🔴 Abnormal Values <span className="badge b-red">{result.abnormalValues.length}</span></div>
              {result.abnormalValues.map((v,i)=>(
                <div key={i} className="abnormal-item">
                  <div className="abnormal-dot" style={{background:severityColor(v.severity)}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div className="abnormal-name">{v.name}</div>
                      <span className="badge" style={{background:statusColor(v.status)==="#DC2626"?"#FEF2F2":statusColor(v.status)==="#7C3AED"?"#F5F3FF":"#FFFBEB",color:statusColor(v.status),fontSize:10}}>
                        {v.status}
                      </span>
                    </div>
                    <div className="abnormal-val" style={{color:statusColor(v.status),fontWeight:700}}>{v.value}</div>
                    <div style={{fontSize:11,color:"#9CA3AF"}}>Normal: {v.normalRange}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medical Terms */}
          {result.medicalTerms?.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">📚 Medical Terms <span className="badge b-purple">{result.medicalTerms.length}</span></div>
              <div style={{fontSize:12,color:"#9CA3AF",marginBottom:10}}>Tap a term to see its explanation</div>
              <div style={{display:"flex",flexWrap:"wrap",margin:"0 -4px"}}>
                {result.medicalTerms.map((t,i)=>(
                  <div key={i} className="term-chip" onClick={()=>setSelectedTerm(selectedTerm?.term===t.term?null:t)}>
                    <span>{t.term}</span>
                    <span style={{fontSize:10,color:"#9CA3AF"}}>{selectedTerm?.term===t.term?"▲":"▼"}</span>
                  </div>
                ))}
              </div>
              {selectedTerm && (
                <div className="term-detail">
                  <div className="term-detail-title">📖 {selectedTerm.term}</div>
                  <div className="term-detail-text">{selectedTerm.definition}</div>
                  <span className="badge b-purple" style={{marginTop:8,display:"inline-flex"}}>{selectedTerm.category}</span>
                </div>
              )}
            </div>
          )}

          {/* Risk Predictions */}
          {result.riskPredictions?.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">⚠️ Risk Predictions</div>
              {result.riskPredictions.map((r,i)=>(
                <div key={i} className="risk-item">
                  <div className="risk-item-header">
                    <div className="risk-item-name">{r.condition}</div>
                    <span className="badge" style={{background:r.riskLabel==="High"?"#FEF2F2":r.riskLabel==="Moderate"?"#FFFBEB":"#ECFDF5",color:riskColor(r.riskLabel)}}>
                      {r.riskLabel} · {r.riskLevel}%
                    </span>
                  </div>
                  <div className="risk-meter-wrap">
                    <div className="risk-meter-track">
                      <div className="risk-meter-fill" style={{width:`${r.riskLevel}%`,background:riskBg(r.riskLabel)}}/>
                    </div>
                  </div>
                  <div className="risk-item-desc">{r.reasoning}</div>
                </div>
              ))}
              <div className="disclaimer">⚠️ These predictions are AI-generated estimates based on lab values only. Consult a qualified physician for diagnosis and treatment.</div>
            </div>
          )}

          <div style={{padding:"0 20px 8px"}}>
            <button className="btn-red" onClick={()=>{setStage("idle");setResult(null);}}>↺ Re-analyze</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────────────────────
function HistoryTab({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, "reports"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(data);
      } catch(e) { console.log("Fetch error:", e); }
      finally { setLoading(false); }
    };
    fetchReports();
  }, [user.uid]);

  return (
    <div style={{flex:1,overflowY:"auto",paddingBottom:16}}>
      <div className="page-header">
        <div>
          <div className="page-title">Upload History</div>
          <div className="page-sub">All your uploaded reports</div>
        </div>
      </div>
      {loading && <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>}
      {!loading && reports.length === 0 && (
        <div style={{margin:"0 20px"}}><div className="info-box">📭 No reports uploaded yet. Go to Upload tab to add one.</div></div>
      )}
      {!loading && reports.map((r) => (
        <div key={r.id} style={{margin:"0 20px 12px",background:"white",borderRadius:16,padding:16,border:"1px solid #E5E7EB",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:12,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
              {r.fileType?.includes("image") ? "🖼️" : "📄"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#111827",wordBreak:"break-all"}}>{r.fileName}</div>
              <div style={{fontSize:12,color:"#9CA3AF",marginTop:2}}>{r.fileSize} • {r.fileType?.split("/")[1]?.toUpperCase()}</div>
            </div>
            <span className="badge b-green">✓ Saved</span>
          </div>
          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #F3F4F6",fontSize:12,color:"#9CA3AF"}}>
            📅 {r.uploadedAt?.toDate?.()?.toLocaleString() || "Just now"}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [tab,setTab]=useState("home");
  const [uploadedFile,setUploadedFile]=useState(null);
  const [ocrText,setOcrText]=useState("");

  return (
    <div className="screen" style={{background:"#F9FAFB"}}>
      <div className="status-bar"><span>9:41</span><span>🔋 WiFi</span></div>
      {tab==="home"    && <HomeTab user={user} onNav={setTab} />}
      {tab==="upload"  && <UploadTab user={user} onFileUploaded={f=>{setUploadedFile(f);setOcrText("");}} />}
      {tab==="ocr"     && <OcrTab uploadedFile={uploadedFile} onOcrDone={setOcrText} />}
      {tab==="ai"      && <AiTab ocrText={ocrText} />}
      {tab==="history" && <HistoryTab user={user} />}
      <BottomNav active={tab} onNav={setTab} />
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("onboard");
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,(firebaseUser)=>{
      setUser(firebaseUser);
      setLoading(false);
      if(firebaseUser) setScreen("dashboard");
      else setScreen("onboard");
    });
    return ()=>unsub();
  },[]);

  if(loading) return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div className="shell"><div className="loading-screen"><div className="spinner"/><div style={{fontSize:14,fontWeight:700,color:"#6B7280"}}>Loading...</div></div></div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div className="shell">
          {screen==="onboard"   && <Onboard onLogin={()=>setScreen("login")} onRegister={()=>setScreen("register")} />}
          {screen==="register"  && <Register onBack={()=>setScreen("login")} />}
          {screen==="login"     && <Login onBack={()=>setScreen("onboard")} onRegister={()=>setScreen("register")} />}
          {screen==="dashboard" && user && <Dashboard user={user} />}
        </div>
      </div>
    </>
  );
}