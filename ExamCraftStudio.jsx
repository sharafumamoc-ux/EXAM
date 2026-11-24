import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Shield, Building2, GraduationCap, LogOut, Plus, Trash2, CheckCircle2,
  XCircle, Clock, CreditCard, FileText, Download, Sparkles, Send, Bot,
  User, BookOpen, Layers, FolderTree, Sliders, Layout, Eye, KeyRound,
  Lock, Unlock, AlertTriangle, Check, ChevronRight, Search, RefreshCw,
  Award, FileCheck2, Printer, Settings, Users, Menu, X,
  Image as ImageIcon, Upload, Bold, Italic, Underline, Type, Globe, Cloud, CloudOff, Database
} from 'lucide-react';

// ============================================================================
// FIREBASE INITIALIZATION (AUTH + CLOUD FIRESTORE + FIREBASE STORAGE)
// ============================================================================

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'examcraft-studio-default';
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const storage = firebaseApp ? getStorage(firebaseApp) : null;

// ============================================================================
// ADMIN-CONTROLLED AI CHATBOT DEFAULT POLICY
// ============================================================================

const DEFAULT_CHATBOT_CONFIG = {
  enabled: true,
  allowInstitution: true,
  allowFaculty: true,
  allowAiImageGeneration: true,
  strictSyllabusOnly: true,
  maxQuestionsPerPrompt: 5,
  maxMarksPerQuestion: 10,
  allowedDifficulties: ['Easy', 'Medium', 'Hard'],
  customAdminGuidelines: 'Follow official board examination standards. Ensure clear, unambiguous wording and accurate marking keys.',
  disabledInstitutionIds: [],
  totalPromptsRun: 14,
  totalQuestionsGenerated: 38
};

// ============================================================================
// MULTI-LANGUAGE FONTS & LANGUAGE PRESETS
// ============================================================================

const BUILTIN_FONTS = [
  { id: 'serif', label: 'Classic Serif (Times New Roman)', cssFamily: '"Times New Roman", Georgia, serif', googleFamily: null },
  { id: 'sans', label: 'Modern Sans (Inter / Arial)', cssFamily: '"Inter", "Segoe UI", Arial, sans-serif', googleFamily: 'Inter:wght@400;600;700' },
  { id: 'mono', label: 'Monospace (Courier New)', cssFamily: '"Courier New", Courier, monospace', googleFamily: null },
  { id: 'malayalam', label: 'Malayalam (Manjari / Noto Sans Malayalam)', cssFamily: '"Manjari", "Noto Sans Malayalam", sans-serif', googleFamily: 'Manjari:wght@400;700&family=Noto+Sans+Malayalam:wght@400;600;700' },
  { id: 'hindi', label: 'Hindi / Sanskrit / Marathi (Noto Sans Devanagari)', cssFamily: '"Noto Sans Devanagari", sans-serif', googleFamily: 'Noto+Sans+Devanagari:wght@400;600;700' },
  { id: 'tamil', label: 'Tamil (Noto Sans Tamil)', cssFamily: '"Noto Sans Tamil", sans-serif', googleFamily: 'Noto+Sans+Tamil:wght@400;600;700' },
  { id: 'telugu', label: 'Telugu (Noto Sans Telugu)', cssFamily: '"Noto Sans Telugu", sans-serif', googleFamily: 'Noto+Sans+Telugu:wght@400;600;700' },
  { id: 'kannada', label: 'Kannada (Noto Sans Kannada)', cssFamily: '"Noto Sans Kannada", sans-serif', googleFamily: 'Noto+Sans+Kannada:wght@400;600;700' },
  { id: 'bengali', label: 'Bengali (Noto Sans Bengali)', cssFamily: '"Noto Sans Bengali", sans-serif', googleFamily: 'Noto+Sans+Bengali:wght@400;600;700' },
  { id: 'arabic', label: 'Arabic / Urdu (Noto Naskh Arabic)', cssFamily: '"Noto Naskh Arabic", serif', googleFamily: 'Noto+Naskh+Arabic:wght@400;600;700' },
  { id: 'cjk', label: 'Chinese / Japanese / Korean (Noto Sans SC)', cssFamily: '"Noto Sans SC", sans-serif', googleFamily: 'Noto+Sans+SC:wght@400;700' }
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr', recommendedFont: 'serif' },
  { code: 'ml', name: 'Malayalam (മലയാളം)', dir: 'ltr', recommendedFont: 'malayalam' },
  { code: 'hi', name: 'Hindi (हिन्दी)', dir: 'ltr', recommendedFont: 'hindi' },
  { code: 'ta', name: 'Tamil (தமிழ்)', dir: 'ltr', recommendedFont: 'tamil' },
  { code: 'te', name: 'Telugu (తెలుగు)', dir: 'ltr', recommendedFont: 'telugu' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', dir: 'ltr', recommendedFont: 'kannada' },
  { code: 'bn', name: 'Bengali (বাংলা)', dir: 'ltr', recommendedFont: 'bengali' },
  { code: 'ar', name: 'Arabic (العربية)', dir: 'rtl', recommendedFont: 'arabic' },
  { code: 'ur', name: 'Urdu (اردو)', dir: 'rtl', recommendedFont: 'arabic' },
  { code: 'sa', name: 'Sanskrit (संस्कृतम्)', dir: 'ltr', recommendedFont: 'hindi' },
  { code: 'fr', name: 'French (Français)', dir: 'ltr', recommendedFont: 'serif' },
  { code: 'es', name: 'Spanish (Español)', dir: 'ltr', recommendedFont: 'serif' },
  { code: 'de', name: 'German (Deutsch)', dir: 'ltr', recommendedFont: 'serif' },
  { code: 'zh', name: 'Chinese / Japanese', dir: 'ltr', recommendedFont: 'cjk' },
  { code: 'custom', name: 'Other / Custom Language', dir: 'ltr', recommendedFont: 'sans' }
];

function resolveFontCssFamily(fontId, customFonts = []) {
  const custom = customFonts.find((f) => f.id === fontId);
  if (custom) return custom.cssFamily;
  const builtin = BUILTIN_FONTS.find((f) => f.id === fontId);
  if (builtin) return builtin.cssFamily;
  if (fontId && typeof fontId === 'string') return `"${fontId}", sans-serif`;
  return '"Times New Roman", Georgia, serif';
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawResult = reader.result;
      if (!file.type || !file.type.startsWith('image/')) {
        resolve(rawResult);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1100;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputMime, 0.85));
      };
      img.onerror = () => resolve(rawResult);
      img.src = rawResult;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload binary image/font to Firebase Storage with automatic fallback to optimized DataURL
async function uploadAssetToCloud(fileOrBlob, folder = 'question-images', customName = 'asset.png') {
  const safeName = `${Date.now()}_${(fileOrBlob.name || customName).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  if (storage && auth?.currentUser) {
    try {
      const fileRef = storageRef(storage, `artifacts/${appId}/public/files/${folder}/${safeName}`);
      await uploadBytes(fileRef, fileOrBlob);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (err) {
      console.warn('Firebase Storage bucket fallback to inline data URL:', err?.message);
    }
  }
  return readFileAsDataURL(fileOrBlob);
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

// ============================================================================
// INITIAL SEED DATA (Admin, Institutions, Faculties, Curriculum & Question Bank)
// ============================================================================

const DEFAULT_LAYOUT = {
  headerStyle: 'classic',
  fontFamily: 'serif',
  fontSize: 14,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  textDirection: 'ltr',
  paperLanguage: 'English',
  accentColor: '#1e3a8a',
  borderStyle: 'double',
  logoDataUrl: '',
  logoHeight: 56,
  watermarkMode: 'text',
  watermarkText: 'CONFIDENTIAL',
  watermarkOpacity: 0.08,
  showInstructions: true,
  instructions:
    '1. All questions are compulsory unless internal choice is specified.\n2. Marks are indicated against each question on the right margin.\n3. Draw neat, labeled diagrams wherever necessary.',
  showStudentBox: true,
  institutionMotto: 'Excellence in Knowledge & Integrity'
};

const DEFAULT_MARKING_MODELS = [
  {
    id: 'mm-1',
    name: 'Standard Unit Test (25 Marks)',
    duration: '1 Hour',
    sections: [
      { id: 's1', title: 'Section A - Objective / MCQ', count: 5, marksPerQ: 1 },
      { id: 's2', title: 'Section B - Short Answer', count: 4, marksPerQ: 2 },
      { id: 's3', title: 'Section C - Descriptive / Analytical', count: 3, marksPerQ: 4 }
    ]
  },
  {
    id: 'mm-2',
    name: 'Mid-Term Examination (50 Marks)',
    duration: '2 Hours',
    sections: [
      { id: 's1', title: 'Part I - Very Short Answer', count: 10, marksPerQ: 1 },
      { id: 's2', title: 'Part II - Short Answer', count: 8, marksPerQ: 2 },
      { id: 's3', title: 'Part III - Long Answer', count: 4, marksPerQ: 6 }
    ]
  },
  {
    id: 'mm-3',
    name: 'Annual Board Model (80 Marks)',
    duration: '3 Hours',
    sections: [
      { id: 's1', title: 'Section A - Multiple Choice Questions', count: 20, marksPerQ: 1 },
      { id: 's2', title: 'Section B - Very Short Answer', count: 6, marksPerQ: 2 },
      { id: 's3', title: 'Section C - Short Answer', count: 6, marksPerQ: 3 },
      { id: 's4', title: 'Section D - Long Answer & Case Study', count: 6, marksPerQ: 5 }
    ]
  }
];

const INITIAL_INSTITUTIONS = [
  {
    id: 'inst-1',
    name: "St. Xavier's Higher Secondary Academy",
    code: 'STX-2026',
    email: 'inst@xaviers.edu',
    password: 'inst123',
    status: 'active',
    annualQuota: 100,
    papersUsed: 14,
    planExpiry: '2027-03-31',
    renewalPending: false,
    layout: { ...DEFAULT_LAYOUT },
    markingModels: JSON.parse(JSON.stringify(DEFAULT_MARKING_MODELS))
  },
  {
    id: 'inst-2',
    name: 'Malabar Central Public School',
    code: 'MCP-2026',
    email: 'inst@malabar.edu',
    password: 'inst123',
    status: 'active',
    annualQuota: 100,
    papersUsed: 99,
    planExpiry: '2026-12-31',
    renewalPending: false,
    layout: {
      ...DEFAULT_LAYOUT,
      headerStyle: 'modern-banner',
      accentColor: '#065f46',
      watermarkText: 'MCPS EXAM',
      institutionMotto: 'Lead Kindly Light'
    },
    markingModels: JSON.parse(JSON.stringify(DEFAULT_MARKING_MODELS))
  }
];

const INITIAL_FACULTIES = [
  {
    id: 'fac-1',
    institutionId: 'inst-1',
    name: 'Dr. Arun Menon',
    email: 'arun@xaviers.edu',
    password: 'fac123',
    department: 'Physics & Science',
    status: 'active'
  },
  {
    id: 'fac-2',
    institutionId: 'inst-1',
    name: 'Prof. Priya Nair',
    email: 'priya@xaviers.edu',
    password: 'fac123',
    department: 'Mathematics',
    status: 'active'
  },
  {
    id: 'fac-3',
    institutionId: 'inst-2',
    name: 'Rahul Krishnan',
    email: 'rahul@malabar.edu',
    password: 'fac123',
    department: 'Computer Science',
    status: 'active'
  }
];

const INITIAL_CURRICULUM = [
  {
    id: 'cls-10',
    name: 'Class 10',
    subjects: [
      {
        id: 'sub-phy10',
        name: 'Physics',
        chapters: [
          {
            id: 'ch-light',
            name: 'Chapter 1: Light - Reflection and Refraction',
            topics: [
              {
                id: 'tp-mirrors',
                name: 'Spherical Mirrors & Mirror Formula',
                content:
                  'Concave and convex mirrors, pole, principal axis, center of curvature, focal length (f = R/2). Mirror formula: 1/v + 1/u = 1/f. Magnification m = h_i/h_o = -v/u. Applications in headlights, shaving mirrors, and rear-view mirrors.'
              },
              {
                id: 'tp-refraction',
                name: 'Refraction through Glass Slab & Lenses',
                content:
                  "Snell's Law: sin(i)/sin(r) = n21. Absolute refractive index n = c/v. Convex and concave lenses, Lens formula: 1/v - 1/u = 1/f. Power of a lens P = 1/f (in meters), measured in Dioptres (D)."
              }
            ]
          },
          {
            id: 'ch-elec',
            name: 'Chapter 2: Electricity & Circuits',
            topics: [
              {
                id: 'tp-ohm',
                name: "Ohm's Law & Resistance",
                content:
                  "Electric current I = Q/t (Ampere). Potential difference V = W/Q (Volt). Ohm's law: V = IR at constant temperature. Factors affecting resistance: length, cross-sectional area, nature of material (resistivity), and temperature."
              },
              {
                id: 'tp-power',
                name: 'Heating Effect & Electric Power',
                content:
                  "Joule's law of heating: H = I^2 R t. Electric power P = VI = I^2 R = V^2 / R. Commercial unit of energy: 1 kWh = 3.6 × 10^6 Joules."
              }
            ]
          }
        ]
      },
      {
        id: 'sub-math10',
        name: 'Mathematics',
        chapters: [
          {
            id: 'ch-quad',
            name: 'Chapter 1: Quadratic Equations',
            topics: [
              {
                id: 'tp-roots',
                name: 'Nature of Roots & Quadratic Formula',
                content:
                  'Standard form ax^2 + bx + c = 0 (a ≠ 0). Quadratic formula: x = (-b ± √(b^2 - 4ac)) / 2a. Discriminant D = b^2 - 4ac determines real distinct roots (D > 0), equal roots (D = 0), or no real roots (D < 0).'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'cls-12',
    name: 'Class 12',
    subjects: [
      {
        id: 'sub-cs12',
        name: 'Computer Science',
        chapters: [
          {
            id: 'ch-py',
            name: 'Chapter 1: Data Structures in Python',
            topics: [
              {
                id: 'tp-stack',
                name: 'Stacks & Queues Implementation',
                content:
                  'Stack follows LIFO (Last-In First-Out) with push(), pop(), and peek() operations implemented using Python lists. Overflow and Underflow conditions.'
              }
            ]
          }
        ]
      }
    ]
  }
];

const INITIAL_QUESTIONS_BANK = [
  {
    id: 'q-101',
    classId: 'cls-10',
    subjectId: 'sub-phy10',
    chapterId: 'ch-light',
    topicId: 'tp-mirrors',
    type: 'MCQ',
    marks: 1,
    difficulty: 'Easy',
    text: 'The focal length of a spherical mirror is 20 cm. What is its radius of curvature?',
    options: ['10 cm', '20 cm', '40 cm', '80 cm'],
    answerKey: '40 cm (R = 2f = 2 × 20 = 40 cm)'
  },
  {
    id: 'q-102',
    classId: 'cls-10',
    subjectId: 'sub-phy10',
    chapterId: 'ch-light',
    topicId: 'tp-mirrors',
    type: 'Short Answer',
    marks: 2,
    difficulty: 'Medium',
    text: 'Why do we prefer a convex mirror as a rear-view mirror in vehicles? Give two reasons.',
    options: [],
    answerKey: '1. It always forms an erect, diminished image. 2. It provides a wider field of view because it is curved outwards.'
  },
  {
    id: 'q-103',
    classId: 'cls-10',
    subjectId: 'sub-phy10',
    chapterId: 'ch-light',
    topicId: 'tp-refraction',
    type: 'Long Answer',
    marks: 4,
    difficulty: 'Hard',
    text: 'A 5 cm tall object is placed perpendicular to the principal axis of a convex lens of focal length 20 cm at a distance of 30 cm. Find the position, nature, and size of the image formed.',
    options: [],
    answerKey: 'u = -30 cm, f = +20 cm => 1/v = 1/20 - 1/30 = 1/60 => v = +60 cm. Real, inverted, height = -10 cm.'
  },
  {
    id: 'q-104',
    classId: 'cls-10',
    subjectId: 'sub-phy10',
    chapterId: 'ch-elec',
    topicId: 'tp-ohm',
    type: 'MCQ',
    marks: 1,
    difficulty: 'Easy',
    text: 'The SI unit of electrical resistivity is:',
    options: ['Ohm', 'Ohm-meter (Ω·m)', 'Volt/Ampere', 'Watt'],
    answerKey: 'Ohm-meter (Ω·m)'
  },
  {
    id: 'q-105',
    classId: 'cls-10',
    subjectId: 'sub-phy10',
    chapterId: 'ch-elec',
    topicId: 'tp-power',
    type: 'Short Answer',
    marks: 2,
    difficulty: 'Medium',
    text: "State Joule's Law of Heating and write its mathematical expression.",
    options: [],
    answerKey: 'Heat produced in a resistor is directly proportional to square of current, resistance, and time: H = I²Rt.'
  },
  {
    id: 'q-106',
    classId: 'cls-10',
    subjectId: 'sub-math10',
    chapterId: 'ch-quad',
    topicId: 'tp-roots',
    type: 'Short Answer',
    marks: 3,
    difficulty: 'Medium',
    text: 'Find the values of k for which the quadratic equation 2x² + kx + 3 = 0 has two equal real roots.',
    options: [],
    answerKey: 'D = k² - 4(2)(3) = 0 => k² = 24 => k = ±2√6.'
  },
  {
    id: 'q-107',
    classId: 'cls-12',
    subjectId: 'sub-cs12',
    chapterId: 'ch-py',
    topicId: 'tp-stack',
    type: 'Long Answer',
    marks: 5,
    difficulty: 'Medium',
    text: 'Write user-defined functions PushBook(Stack, Book) and PopBook(Stack) in Python to implement stack operations on a list of book titles.',
    options: [],
    answerKey: 'Use Stack.append(Book) for push and check if len(Stack)==0 before Stack.pop().'
  }
];

const INITIAL_PAPERS = [
  {
    id: 'paper-1',
    institutionId: 'inst-1',
    createdByRole: 'faculty',
    createdById: 'fac-1',
    createdByName: 'Dr. Arun Menon',
    title: 'First Term Physics Assessment - 2026',
    classId: 'cls-10',
    subjectId: 'sub-phy10',
    examDate: '2026-11-28',
    duration: '1 Hour',
    markingModelId: 'mm-1',
    markingModelName: 'Standard Unit Test (25 Marks)',
    status: 'verified',
    reviewNote: 'Well-balanced blueprint alignment. Approved for printing.',
    createdAt: '2026-11-20',
    questions: [
      { ...INITIAL_QUESTIONS_BANK[0], sectionTitle: 'Section A - Objective / MCQ', source: 'Question Bank' },
      { ...INITIAL_QUESTIONS_BANK[3], sectionTitle: 'Section A - Objective / MCQ', source: 'Question Bank' },
      { ...INITIAL_QUESTIONS_BANK[1], sectionTitle: 'Section B - Short Answer', source: 'Question Bank' },
      { ...INITIAL_QUESTIONS_BANK[4], sectionTitle: 'Section B - Short Answer', source: 'Question Bank' },
      { ...INITIAL_QUESTIONS_BANK[2], sectionTitle: 'Section C - Descriptive / Analytical', source: 'Question Bank' }
    ]
  },
  {
    id: 'paper-2',
    institutionId: 'inst-1',
    createdByRole: 'faculty',
    createdById: 'fac-2',
    createdByName: 'Prof. Priya Nair',
    title: 'Class 10 Quadratic Equations Unit Test',
    classId: 'cls-10',
    subjectId: 'sub-math10',
    examDate: '2026-12-04',
    duration: '1 Hour',
    markingModelId: 'mm-1',
    markingModelName: 'Standard Unit Test (25 Marks)',
    status: 'pending_verification',
    reviewNote: '',
    createdAt: '2026-11-23',
    questions: [
      { ...INITIAL_QUESTIONS_BANK[5], sectionTitle: 'Section B - Short Answer', source: 'Question Bank' }
    ]
  }
];

const INITIAL_RENEWAL_REQUESTS = [
  {
    id: 'ren-1',
    institutionId: 'inst-2',
    institutionName: 'Malabar Central Public School',
    amount: 4999,
    currency: 'INR',
    paymentRef: 'UPI-9482716305',
    requestedAt: '2026-11-22',
    status: 'pending'
  }
];

// ============================================================================
// UTILITY HELPERS: Gemini API with Exponential Backoff, Word & PDF Export
// ============================================================================

async function callGeminiQuestionGenerator({ prompt, contextInfo, marks, count, language = 'English', chatbotConfig = DEFAULT_CHATBOT_CONFIG }) {
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const allowedDiffText = (chatbotConfig.allowedDifficulties || ['Easy', 'Medium', 'Hard']).join(', ');
  const strictRule = chatbotConfig.strictSyllabusOnly
    ? '- STRICT SYLLABUS RULE (Admin Enforced): Generate questions strictly from the provided Class, Subject, Chapter, and Topic syllabus context. Do not include out-of-syllabus concepts.'
    : '- You may include relevant broader application concepts aligned with the subject.';

  const systemPrompt = `You are an expert academic examination setter and multilingual curriculum specialist for schools and colleges.
Your job is to create high-quality, syllabus-aligned exam questions based on the user's request and the provided curriculum context.
Rules:
- Strictly generate the exact number of questions requested (${count}) and assign ${marks} mark(s) to each question unless the user specifically asks for a mix of marks in their message.
- Write the questions, MCQ options, and answerKey strictly in the target language: "${language}". Support any script natively (Malayalam, Hindi, Tamil, Telugu, Kannada, Arabic, Urdu, Bengali, English, European or Asian languages).
- Allowed difficulty levels set by Admin: ${allowedDiffText}.
${strictRule}
- Admin Examination Guidelines: ${chatbotConfig.customAdminGuidelines || 'Standard academic rigor.'}
- If a question involves a geometry figure, circuit, ray diagram, graph, or visual setup where an image would help students, set needsImage to true and provide a concise English diagram description in imagePrompt. Otherwise set needsImage to false and imagePrompt to "".
- If a question is 1 mark and objective/MCQ, provide 4 clear options. For non-MCQ questions, leave options as an empty array [].
- Always provide a concise, accurate answerKey / marking hint for teachers.
- Respond strictly in the required JSON schema.`;

  const userQuery = `Curriculum Context:
${contextInfo}

Target Output Language: ${language}
Target Marks per Question: ${marks}
Requested Count: ${count}
Faculty Request: ${prompt}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          replyMessage: { type: 'STRING' },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                text: { type: 'STRING' },
                marks: { type: 'NUMBER' },
                type: { type: 'STRING' },
                difficulty: { type: 'STRING' },
                options: { type: 'ARRAY', items: { type: 'STRING' } },
                answerKey: { type: 'STRING' },
                needsImage: { type: 'BOOLEAN' },
                imagePrompt: { type: 'STRING' }
              },
              required: ['text', 'marks', 'type', 'difficulty', 'options', 'answerKey', 'needsImage', 'imagePrompt']
            }
          }
        },
        required: ['replyMessage', 'questions']
      }
    }
  };

  const delays = [1000, 2000, 4000];
  let lastError = null;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`API temporary status ${response.status}`);
        }
        const errBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from AI');
      return JSON.parse(rawText);
    } catch (err) {
      lastError = err;
      if (attempt < delays.length) {
        await new Promise((res) => setTimeout(res, delays[attempt]));
      }
    }
  }
  throw lastError || new Error('Failed to generate questions');
}

// Generate clean academic diagram / visual and upload to Firebase Storage
async function callGeminiDiagramGenerator(diagramDescription) {
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{
        text: `Clean, clear educational textbook diagram on a pure white background suitable for printing on a school examination paper. High contrast, neat lines, minimal labels. Subject: ${diagramDescription}`
      }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE']
    }
  };

  const delays = [1000, 2000, 4000];
  let lastError = null;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Image API status ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const base64Data = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
      if (!base64Data) throw new Error('No image returned by AI');
      const dataUrl = `data:image/png;base64,${base64Data}`;
      const blob = dataUrlToBlob(dataUrl);
      const uploadedUrl = await uploadAssetToCloud(blob, 'question-images', `ai_diagram_${Date.now()}.png`);
      return uploadedUrl || dataUrl;
    } catch (err) {
      lastError = err;
      if (attempt < delays.length) {
        await new Promise((res) => setTimeout(res, delays[attempt]));
      }
    }
  }
  throw lastError || new Error('Failed to generate diagram');
}

// Helper to group questions by section cleanly
function groupQuestionsBySection(questions) {
  const groups = [];
  const map = new Map();
  questions.forEach((q) => {
    const sec = q.sectionTitle || 'Section A - General Questions';
    if (!map.has(sec)) {
      const entry = { sectionTitle: sec, items: [] };
      map.set(sec, entry);
      groups.push(entry);
    }
    map.get(sec).items.push(q);
  });
  return groups;
}

// Build Printable HTML Document (Shared by Word .doc and Print/PDF)
function buildPrintablePaperHtml(paper, institution, className, subjectName, includeAnswers = false, customFonts = []) {
  const layout = { ...DEFAULT_LAYOUT, ...(institution?.layout || {}) };
  const totalMarks = paper.questions.reduce((acc, q) => acc + Number(q.marks || 0), 0);
  const effectiveFontId = paper.fontFamily || layout.fontFamily || 'serif';
  const fontStack = resolveFontCssFamily(effectiveFontId, customFonts);
  const baseFontSize = paper.fontSize || layout.fontSize || 14;
  const textDir = paper.textDirection || layout.textDirection || 'ltr';

  const builtinGoogleLinks = BUILTIN_FONTS
    .filter((f) => f.googleFamily)
    .map((f) => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${f.googleFamily}&display=swap" />`)
    .join('\n');

  const customGoogleLinks = customFonts
    .filter((f) => f.googleFamily)
    .map((f) => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${f.googleFamily}&display=swap" />`)
    .join('\n');

  const customFontFaces = customFonts
    .filter((f) => f.dataUrl)
    .map((f) => `@font-face { font-family: "${f.name}"; src: url("${f.dataUrl}"); }`)
    .join('\n');

  const borderCss =
    layout.borderStyle === 'double'
      ? `border: 3px double ${layout.accentColor};`
      : layout.borderStyle === 'solid'
      ? `border: 1.5px solid ${layout.accentColor};`
      : 'border: none;';

  const logoHtml = layout.logoDataUrl
    ? `<img src="${layout.logoDataUrl}" alt="Institution Logo" style="height:${layout.logoHeight || 56}px; max-width:140px; object-fit:contain;" />`
    : '';

  const headerHtml =
    layout.headerStyle === 'modern-banner'
      ? `<div style="background:${layout.accentColor}; color:#ffffff; padding:16px 20px; border-radius:6px; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; gap:16px;">
          ${logoHtml ? `<div style="background:#ffffff; padding:4px; border-radius:6px; flex-shrink:0;">${logoHtml}</div>` : ''}
          <div style="flex:1; text-align:center;">
            <div style="font-size:18pt; font-weight:700; letter-spacing:0.5px;">${institution?.name || 'Examination Board'}</div>
            ${layout.institutionMotto ? `<div style="font-size:9.5pt; opacity:0.9; font-style:italic; margin-top:2px;">"${layout.institutionMotto}"</div>` : ''}
            <div style="font-size:12pt; font-weight:600; margin-top:6px; text-transform:uppercase;">${paper.title}</div>
          </div>
          ${logoHtml ? '<div style="width:60px;"></div>' : ''}
        </div>`
      : layout.headerStyle === 'minimal'
      ? `<div style="border-bottom:2px solid ${layout.accentColor}; padding-bottom:10px; margin-bottom:14px; display:flex; align-items:center; gap:14px;">
          ${logoHtml}
          <div style="flex:1;">
            <div style="font-size:16pt; font-weight:700; color:${layout.accentColor};">${institution?.name || 'Examination Board'}</div>
            <div style="font-size:12pt; font-weight:600; margin-top:2px;">${paper.title}</div>
          </div>
        </div>`
      : `<div style="text-align:center; border-bottom:2px solid ${layout.accentColor}; padding-bottom:10px; margin-bottom:14px;">
          ${logoHtml ? `<div style="margin-bottom:6px;">${logoHtml}</div>` : ''}
          <div style="font-size:17pt; font-weight:700; color:${layout.accentColor}; text-transform:uppercase;">${institution?.name || 'Examination Board'}</div>
          ${layout.institutionMotto ? `<div style="font-size:9.5pt; color:#475569; font-style:italic; margin-top:2px;">${layout.institutionMotto}</div>` : ''}
          <div style="font-size:12.5pt; font-weight:700; margin-top:6px;">${paper.title}</div>
        </div>`;

  const instructionsHtml = layout.showInstructions && layout.instructions
    ? `<div style="margin:12px 0; padding:8px 12px; background:#f8fafc; border:1px solid #cbd5e1; font-size:9.5pt;">
        <strong style="color:${layout.accentColor};">General Instructions:</strong>
        <div style="white-space:pre-line; margin-top:4px; line-height:1.4;">${layout.instructions}</div>
      </div>`
    : '';

  const topImageWidth = paper.topImageSize === 'small' ? '220px' : paper.topImageSize === 'full' ? '100%' : '380px';
  const topPaperImageHtml = paper.topImage
    ? `<div style="margin:12px 0; text-align:center; padding:8px; border:1px solid #e2e8f0; border-radius:8px; background:#fafafa;">
        <img src="${paper.topImage}" alt="Top Reference Visual" style="max-width:100%; width:${topImageWidth}; max-height:260px; object-fit:contain; display:inline-block;" />
        ${paper.topImageCaption ? `<div style="font-size:9.5pt; color:#475569; font-style:italic; margin-top:4px;">${paper.topImageCaption}</div>` : ''}
      </div>`
    : '';

  const studentBoxHtml = layout.showStudentBox
    ? `<table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:10pt;">
        <tr>
          <td style="border:1px solid #94a3b8; padding:5px 8px; width:55%;"><strong>Student Name:</strong> ___________________________</td>
          <td style="border:1px solid #94a3b8; padding:5px 8px; width:45%;"><strong>Roll No:</strong> _______________</td>
        </tr>
      </table>`
    : '';

  const grouped = groupQuestionsBySection(paper.questions);
  let qNum = 1;

  const sectionsHtml = grouped
    .map((sec) => {
      const secMarks = sec.items.reduce((s, item) => s + Number(item.marks || 0), 0);
      const qRows = sec.items
        .map((q) => {
          const currentNum = qNum++;
          const qFontFamily = q.fontFamily ? resolveFontCssFamily(q.fontFamily, customFonts) : fontStack;
          const qFontSize = q.fontSize || baseFontSize;
          const qWeight = (q.bold !== undefined ? q.bold : layout.isBold) ? '700' : '400';
          const qStyle = (q.italic !== undefined ? q.italic : layout.isItalic) ? 'italic' : 'normal';
          const qDeco = (q.underline !== undefined ? q.underline : layout.isUnderline) ? 'underline' : 'none';

          const optsHtml =
            q.options && q.options.length > 0
              ? `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px 16px; margin-top:5px; padding-left:18px; font-size:${Math.max(10, qFontSize - 1)}px;">
                  ${q.options.map((opt, idx) => `<div>(${String.fromCharCode(97 + idx)}) ${opt}</div>`).join('')}
                </div>`
              : '';

          const imgWidth = q.imageSize === 'small' ? '160px' : q.imageSize === 'large' ? '360px' : '240px';
          const imageHtml = q.imageData
            ? `<div style="margin:8px 0 6px 18px;">
                <img src="${q.imageData}" alt="Question Diagram" style="max-width:100%; width:${imgWidth}; max-height:240px; object-fit:contain; border:1px solid #cbd5e1; padding:3px; border-radius:4px;" />
                ${q.imageCaption ? `<div style="font-size:9pt; color:#475569; font-style:italic; margin-top:2px;">${q.imageCaption}</div>` : ''}
              </div>`
            : '';

          const ansHtml =
            includeAnswers && q.answerKey
              ? `<div style="margin-top:5px; padding:4px 8px; background:#ecfdf5; border-left:3px solid #059669; color:#065f46; font-size:9.5pt;">
                  <strong>Answer Key:</strong> ${q.answerKey}
                </div>`
              : '';

          return `<div style="margin-bottom:11px; page-break-inside:avoid;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="vertical-align:top; width:28px; font-weight:700;">${currentNum}.</td>
                <td style="vertical-align:top; line-height:1.5; font-family:${qFontFamily}; font-size:${qFontSize}px; font-weight:${qWeight}; font-style:${qStyle}; text-decoration:${qDeco};">
                  ${q.text}
                  ${imageHtml}
                  ${optsHtml}
                  ${ansHtml}
                </td>
                <td style="vertical-align:top; text-align:right; width:64px; font-weight:700; white-space:nowrap;">[${q.marks}]</td>
              </tr>
            </table>
          </div>`;
        })
        .join('');

      return `<div style="margin-top:14px;">
        <div style="background:#f1f5f9; border-left:4px solid ${layout.accentColor}; padding:5px 10px; font-weight:700; font-size:10.5pt; color:${layout.accentColor}; margin-bottom:10px; display:flex; justify-content:space-between;">
          <span>${sec.sectionTitle}</span>
          <span>(${secMarks} Marks)</span>
        </div>
        ${qRows}
      </div>`;
    })
    .join('');

  const watermarkHtml =
    layout.watermarkMode === 'logo' && layout.logoDataUrl
      ? `<div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); opacity:${layout.watermarkOpacity ?? 0.08}; pointer-events:none; z-index:0;">
          <img src="${layout.logoDataUrl}" alt="Watermark" style="width:320px; max-width:70vw; object-fit:contain;" />
        </div>`
      : layout.watermarkMode !== 'none' && layout.watermarkText
      ? `<div style="position:fixed; top:48%; left:50%; transform:translate(-50%,-50%) rotate(-32deg); font-size:52pt; font-weight:800; color:rgba(100,116,139,${layout.watermarkOpacity ?? 0.08}); pointer-events:none; z-index:0; white-space:nowrap;">
          ${layout.watermarkText}
        </div>`
      : '';

  return `<!DOCTYPE html>
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" dir="${textDir}">
  <head>
    <meta charset="utf-8" />
    <title>${paper.title}</title>
    ${builtinGoogleLinks}
    ${customGoogleLinks}
    <style>
      ${customFontFaces}
      @page { size: A4; margin: 16mm; }
      body { font-family: ${fontStack}; font-size: ${baseFontSize}px; color: #0f172a; margin: 0; padding: 0; direction: ${textDir}; }
      .page-wrap { ${borderCss} padding: 18px 22px; position: relative; min-height: 92vh; }
    </style>
  </head>
  <body>
    <div class="page-wrap">
      ${watermarkHtml}
      ${headerHtml}
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:10.5pt; border-bottom:1px solid #cbd5e1; padding-bottom:6px;">
        <tr>
          <td style="padding:3px 0;"><strong>Class:</strong> ${className}</td>
          <td style="padding:3px 0; text-align:center;"><strong>Subject:</strong> ${subjectName}</td>
          <td style="padding:3px 0; text-align:right;"><strong>Max. Marks:</strong> ${totalMarks}</td>
        </tr>
        <tr>
          <td style="padding:3px 0;"><strong>Date:</strong> ${paper.examDate || 'TBD'}</td>
          <td style="padding:3px 0; text-align:center;"><strong>Language:</strong> ${paper.language || layout.paperLanguage || 'English'}</td>
          <td style="padding:3px 0; text-align:right;"><strong>Time Allowed:</strong> ${paper.duration || '1 Hour'}</td>
        </tr>
      </table>

      ${studentBoxHtml}
      ${instructionsHtml}
      ${topPaperImageHtml}
      ${sectionsHtml}

      <div style="margin-top:26px; text-align:center; font-size:9.5pt; color:#64748b; border-top:1px dashed #cbd5e1; padding-top:8px;">
        *** End of Question Paper ***
      </div>
    </div>
  </body>
  </html>`;
}

function exportPaperToWord(paper, institution, className, subjectName, includeAnswers = false, customFonts = []) {
  const html = buildPrintablePaperHtml(paper, institution, className, subjectName, includeAnswers, customFonts);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (paper.title || 'Question_Paper').replace(/[^a-z0-9]/gi, '_');
  link.download = `${safeName}${includeAnswers ? '_With_Key' : ''}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportPaperToPdfPrint(paper, institution, className, subjectName, includeAnswers = false, customFonts = []) {
  const html = buildPrintablePaperHtml(paper, institution, className, subjectName, includeAnswers, customFonts);
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
  return true;
}

// ============================================================================
// REUSABLE LIVE A4 QUESTION PAPER PREVIEW COMPONENT
// ============================================================================

function PaperPreviewCanvas({ paper, institution, className, subjectName, showAnswers = false, customFonts = [] }) {
  const layout = { ...DEFAULT_LAYOUT, ...(institution?.layout || {}) };
  const totalMarks = paper.questions.reduce((acc, q) => acc + Number(q.marks || 0), 0);
  const grouped = groupQuestionsBySection(paper.questions);
  let qCounter = 1;

  const effectiveFontId = paper.fontFamily || layout.fontFamily || 'serif';
  const fontFamilyCss = resolveFontCssFamily(effectiveFontId, customFonts);
  const baseFontSize = paper.fontSize || layout.fontSize || 14;
  const textDir = paper.textDirection || layout.textDirection || 'ltr';

  const borderClasses =
    layout.borderStyle === 'double'
      ? 'border-4 border-double'
      : layout.borderStyle === 'solid'
      ? 'border-2'
      : 'border border-slate-200';

  return (
    <div
      dir={textDir}
      className={`relative bg-white text-slate-900 shadow-xl mx-auto w-full max-w-[800px] p-6 sm:p-10 rounded-sm overflow-hidden ${borderClasses}`}
      style={{
        fontFamily: fontFamilyCss,
        fontSize: `${baseFontSize}px`,
        borderColor: layout.borderStyle !== 'none' ? layout.accentColor : undefined
      }}
    >
      {/* Watermark (Text or Institution Logo) */}
      {layout.watermarkMode === 'logo' && layout.logoDataUrl ? (
        <div
          className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: layout.watermarkOpacity ?? 0.08 }}
        >
          <img
            src={layout.logoDataUrl}
            alt="Logo Watermark"
            className="w-72 max-w-[65%] object-contain"
          />
        </div>
      ) : layout.watermarkMode !== 'none' && layout.watermarkText ? (
        <div
          className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ opacity: layout.watermarkOpacity ?? 0.08 }}
        >
          <span className="text-5xl sm:text-7xl font-black tracking-widest text-slate-600 -rotate-30 whitespace-nowrap">
            {layout.watermarkText}
          </span>
        </div>
      ) : null}

      <div className="relative z-10">
        {/* Header Style Variants */}
        {layout.headerStyle === 'modern-banner' ? (
          <div
            className="p-4 sm:p-5 rounded-md text-white mb-4 flex items-center justify-between gap-4"
            style={{ backgroundColor: layout.accentColor }}
          >
            {layout.logoDataUrl && (
              <div className="bg-white p-1.5 rounded-md shrink-0">
                <img
                  src={layout.logoDataUrl}
                  alt="Institution Logo"
                  style={{ height: `${layout.logoHeight || 56}px` }}
                  className="max-w-[120px] object-contain"
                />
              </div>
            )}
            <div className="flex-1 text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wide">{institution?.name}</h2>
              {layout.institutionMotto && (
                <p className="text-xs italic opacity-90 mt-0.5">"{layout.institutionMotto}"</p>
              )}
              <p className="text-sm sm:text-base font-semibold uppercase tracking-wider mt-2">{paper.title || 'Untitled Question Paper'}</p>
            </div>
            {layout.logoDataUrl && <div className="hidden sm:block w-12" />}
          </div>
        ) : layout.headerStyle === 'minimal' ? (
          <div className="pb-3 mb-4 border-b-2 flex items-center gap-4" style={{ borderColor: layout.accentColor }}>
            {layout.logoDataUrl && (
              <img
                src={layout.logoDataUrl}
                alt="Institution Logo"
                style={{ height: `${layout.logoHeight || 56}px` }}
                className="max-w-[120px] object-contain shrink-0"
              />
            )}
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: layout.accentColor }}>{institution?.name}</h2>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{paper.title || 'Untitled Question Paper'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center pb-3 mb-4 border-b-2" style={{ borderColor: layout.accentColor }}>
            {layout.logoDataUrl && (
              <div className="flex justify-center mb-2">
                <img
                  src={layout.logoDataUrl}
                  alt="Institution Logo"
                  style={{ height: `${layout.logoHeight || 56}px` }}
                  className="max-w-[140px] object-contain"
                />
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide" style={{ color: layout.accentColor }}>
              {institution?.name}
            </h2>
            {layout.institutionMotto && (
              <p className="text-xs italic text-slate-500 mt-0.5">{layout.institutionMotto}</p>
            )}
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">{paper.title || 'Untitled Question Paper'}</p>
          </div>
        )}

        {/* Exam Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm pb-3 mb-3 border-b border-slate-300">
          <div><strong>Class:</strong> {className}</div>
          <div className="sm:text-center"><strong>Subject:</strong> {subjectName}</div>
          <div className="sm:text-right"><strong>Max. Marks:</strong> {totalMarks}</div>
          <div><strong>Date:</strong> {paper.examDate || 'TBD'}</div>
          <div className="sm:text-center"><strong>Language:</strong> {paper.language || layout.paperLanguage || 'English'}</div>
          <div className="sm:text-right"><strong>Time:</strong> {paper.duration || '1 Hour'}</div>
        </div>

        {/* Optional Student Info Box */}
        {layout.showStudentBox && (
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-slate-400 text-xs mb-3">
            <div className="p-2 border-b sm:border-b-0 sm:border-r border-slate-400">
              <strong>Student Name:</strong> ___________________________
            </div>
            <div className="p-2">
              <strong>Roll No / Reg ID:</strong> ___________________
            </div>
          </div>
        )}

        {/* General Instructions */}
        {layout.showInstructions && layout.instructions && (
          <div className="mb-5 p-3 rounded bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold mb-1" style={{ color: layout.accentColor }}>General Instructions:</div>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed">{layout.instructions}</div>
          </div>
        )}

        {/* Top-of-Paper Reference Image / Banner Visual */}
        {paper.topImage && (
          <div className="mb-5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
            <img
              src={paper.topImage}
              alt={paper.topImageCaption || 'Question Paper Reference Visual'}
              className={`mx-auto object-contain rounded-lg ${
                paper.topImageSize === 'small'
                  ? 'max-w-[220px] max-h-44'
                  : paper.topImageSize === 'full'
                  ? 'w-full max-h-64'
                  : 'max-w-[380px] max-h-56'
              }`}
            />
            {paper.topImageCaption && (
              <p className="text-xs text-slate-600 italic mt-1.5">{paper.topImageCaption}</p>
            )}
          </div>
        )}

        {/* Questions by Section */}
        {grouped.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic text-sm border border-dashed border-slate-300 rounded-lg">
            No questions added yet. Add questions from the Syllabus Question Bank, Image Questions, or AI Chatbot.
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((sec, sIdx) => {
              const secMarks = sec.items.reduce((sum, item) => sum + Number(item.marks || 0), 0);
              return (
                <div key={sIdx}>
                  <div
                    className="px-3 py-1.5 font-bold text-xs sm:text-sm flex justify-between items-center mb-3 bg-slate-100 border-l-4"
                    style={{ borderColor: layout.accentColor, color: layout.accentColor }}
                  >
                    <span>{sec.sectionTitle}</span>
                    <span>({secMarks} Marks)</span>
                  </div>

                  <div className="space-y-3.5">
                    {sec.items.map((q) => {
                      const num = qCounter++;
                      const qFontCss = q.fontFamily ? resolveFontCssFamily(q.fontFamily, customFonts) : fontFamilyCss;
                      const qSize = q.fontSize || baseFontSize;
                      const isBold = q.bold !== undefined ? q.bold : layout.isBold;
                      const isItalic = q.italic !== undefined ? q.italic : layout.isItalic;
                      const isUnderline = q.underline !== undefined ? q.underline : layout.isUnderline;

                      return (
                        <div key={q.id + '-' + num} className="flex items-start gap-2.5">
                          <span className="font-bold min-w-[24px]">{num}.</span>
                          <div className="flex-1">
                            <p
                              className="leading-relaxed"
                              style={{
                                fontFamily: qFontCss,
                                fontSize: `${qSize}px`,
                                fontWeight: isBold ? '700' : '400',
                                fontStyle: isItalic ? 'italic' : 'normal',
                                textDecoration: isUnderline ? 'underline' : 'none'
                              }}
                            >
                              {q.text}
                            </p>

                            {/* Question Image Attachment */}
                            {q.imageData && (
                              <div className="my-2">
                                <img
                                  src={q.imageData}
                                  alt={q.imageCaption || 'Question Figure'}
                                  className={`object-contain border border-slate-300 rounded p-1 bg-white ${
                                    q.imageSize === 'small'
                                      ? 'max-w-[160px] max-h-36'
                                      : q.imageSize === 'large'
                                      ? 'max-w-[360px] max-h-64'
                                      : 'max-w-[240px] max-h-48'
                                  }`}
                                />
                                {q.imageCaption && (
                                  <p className="text-[11px] text-slate-500 italic mt-1">{q.imageCaption}</p>
                                )}
                              </div>
                            )}

                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-1.5 pl-2 text-slate-700" style={{ fontSize: `${Math.max(11, qSize - 1)}px` }}>
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx}>({String.fromCharCode(97 + oIdx)}) {opt}</div>
                                ))}
                              </div>
                            )}

                            {showAnswers && q.answerKey && (
                              <div className="mt-2 px-2.5 py-1.5 rounded bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 text-xs">
                                <strong>Marking Key:</strong> {q.answerKey}
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-xs sm:text-sm whitespace-nowrap">[{q.marks}]</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-3 border-t border-dashed border-slate-300 text-center text-xs text-slate-400">
          *** End of Question Paper ***
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QUESTION PAPER BUILDER + AI CHATBOT + IMAGE QUESTIONS + MULTILINGUAL STUDIO
// ============================================================================

function QuestionPaperBuilder({
  currentUser,
  institution,
  curriculum,
  questionsBank,
  customFonts,
  chatbotConfig,
  onChatbotUsage,
  firebaseUser,
  onSyncStatusChange,
  editingPaper,
  onSavePaper,
  onCancel,
  notify
}) {
  const remainingQuota = (institution?.annualQuota || 100) - (institution?.papersUsed || 0);
  const isQuotaExhausted = !editingPaper && remainingQuota <= 0;
  const instLayout = { ...DEFAULT_LAYOUT, ...(institution?.layout || {}) };
  const allFonts = [...BUILTIN_FONTS, ...customFonts];

  // Check if Admin has allowed AI Chatbot for this role & institution
  const isChatbotAllowed = Boolean(
    chatbotConfig?.enabled &&
    (currentUser.role === 'faculty' ? chatbotConfig.allowFaculty : chatbotConfig.allowInstitution) &&
    !(chatbotConfig.disabledInstitutionIds || []).includes(institution?.id)
  );

  // Paper Form State
  const [title, setTitle] = useState(editingPaper?.title || '');
  const [classId, setClassId] = useState(editingPaper?.classId || curriculum[0]?.id || '');
  const selectedClass = curriculum.find((c) => c.id === classId) || curriculum[0];

  const [subjectId, setSubjectId] = useState(editingPaper?.subjectId || selectedClass?.subjects[0]?.id || '');
  const selectedSubject = selectedClass?.subjects.find((s) => s.id === subjectId) || selectedClass?.subjects[0];

  const [examDate, setExamDate] = useState(editingPaper?.examDate || '2026-12-15');
  const [markingModelId, setMarkingModelId] = useState(editingPaper?.markingModelId || institution?.markingModels?.[0]?.id || 'custom');
  const selectedModel = institution?.markingModels?.find((m) => m.id === markingModelId) || null;
  const [duration, setDuration] = useState(editingPaper?.duration || selectedModel?.duration || '1 Hour 30 Mins');
  const [paperLanguage, setPaperLanguage] = useState(editingPaper?.language || instLayout.paperLanguage || 'English');
  const [customLanguageName, setCustomLanguageName] = useState('');
  const [paperFontFamily, setPaperFontFamily] = useState(editingPaper?.fontFamily || instLayout.fontFamily || 'serif');
  const [paperFontSize, setPaperFontSize] = useState(editingPaper?.fontSize || instLayout.fontSize || 14);
  const [paperDirection, setPaperDirection] = useState(editingPaper?.textDirection || instLayout.textDirection || 'ltr');
  const [paperQuestions, setPaperQuestions] = useState(editingPaper?.questions || []);

  // Top-of-Paper Image (Banner / Comprehension / Reference Diagram at Top of Question Paper)
  const [topImage, setTopImage] = useState(editingPaper?.topImage || '');
  const [topImageCaption, setTopImageCaption] = useState(editingPaper?.topImageCaption || '');
  const [topImageSize, setTopImageSize] = useState(editingPaper?.topImageSize || 'medium');
  const [showTopImagePanel, setShowTopImagePanel] = useState(Boolean(editingPaper?.topImage));
  const [generatingImgFor, setGeneratingImgFor] = useState(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  // Workspace Tabs: 'bank' | 'custom_q' | 'chatbot' | 'arrange' | 'preview'
  const [activeWorkspace, setActiveWorkspace] = useState('bank');
  const [targetSection, setTargetSection] = useState(selectedModel?.sections?.[0]?.title || 'Section A - General');
  const [showAnswersInPreview, setShowAnswersInPreview] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const draftDocId = `${currentUser.id}_${editingPaper?.id || 'new_paper'}`;

  // Restore any autosaved in-progress Question Paper draft when opening the builder
  useEffect(() => {
    if (!db || !firebaseUser || draftRestored) return;
    let cancelled = false;
    const loadDraft = async () => {
      try {
        const draftRef = doc(db, 'artifacts', appId, 'public', 'data', 'paperDrafts', draftDocId);
        const snap = await getDoc(draftRef);
        if (!cancelled && snap.exists()) {
          const d = snap.data();
          if (d.title !== undefined) setTitle(d.title);
          if (d.classId) setClassId(d.classId);
          if (d.subjectId) setSubjectId(d.subjectId);
          if (d.examDate) setExamDate(d.examDate);
          if (d.duration) setDuration(d.duration);
          if (d.paperLanguage) setPaperLanguage(d.paperLanguage);
          if (d.paperFontFamily) setPaperFontFamily(d.paperFontFamily);
          if (d.paperFontSize) setPaperFontSize(d.paperFontSize);
          if (d.paperDirection) setPaperDirection(d.paperDirection);
          if (d.topImage !== undefined) setTopImage(d.topImage);
          if (d.topImageCaption !== undefined) setTopImageCaption(d.topImageCaption);
          if (d.topImageSize) setTopImageSize(d.topImageSize);
          if (d.topImage) setShowTopImagePanel(true);
          if (d.markingModelId) setMarkingModelId(d.markingModelId);
          if (Array.isArray(d.paperQuestions)) setPaperQuestions(d.paperQuestions);
        }
      } catch (err) {
        console.error('Draft restore error:', err);
      } finally {
        if (!cancelled) setDraftRestored(true);
      }
    };
    loadDraft();
    return () => { cancelled = true; };
  }, [firebaseUser, draftDocId, draftRestored]);

  // Continuously autosave in-progress Question Paper work to Firestore
  useEffect(() => {
    if (!db || !firebaseUser || !draftRestored) return;
    const timer = setTimeout(async () => {
      try {
        if (onSyncStatusChange) onSyncStatusChange('saving');
        const draftRef = doc(db, 'artifacts', appId, 'public', 'data', 'paperDrafts', draftDocId);
        await setDoc(draftRef, {
          userId: currentUser.id,
          institutionId: institution?.id || '',
          title,
          classId,
          subjectId,
          examDate,
          duration,
          paperLanguage,
          paperFontFamily,
          paperFontSize,
          paperDirection,
          topImage,
          topImageCaption,
          topImageSize,
          markingModelId,
          paperQuestions,
          updatedAt: new Date().toISOString()
        });
        if (onSyncStatusChange) onSyncStatusChange('saved');
      } catch (err) {
        console.error('Draft autosave error:', err);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [
    firebaseUser, draftRestored, draftDocId, currentUser.id, institution?.id,
    title, classId, subjectId, examDate, duration, paperLanguage,
    paperFontFamily, paperFontSize, paperDirection, topImage,
    topImageCaption, topImageSize, markingModelId, paperQuestions, onSyncStatusChange
  ]);

  // Custom / Image Question Form State
  const [customQ, setCustomQ] = useState({
    text: '', type: 'Short Answer', marks: 2, difficulty: 'Medium',
    bold: false, italic: false, underline: false, fontSize: 14, fontFamily: '',
    optA: '', optB: '', optC: '', optD: '', answerKey: '',
    imageData: '', imageCaption: '', imageSize: 'medium',
    alsoAddToTop: false
  });

  // Question Bank Filter State
  const [filterChapterId, setFilterChapterId] = useState('all');
  const [filterTopicId, setFilterTopicId] = useState('all');
  const [filterMarks, setFilterMarks] = useState('all');

  // AI Chatbot State
  const maxAllowedPromptQs = Math.max(1, Number(chatbotConfig?.maxQuestionsPerPrompt || 5));
  const maxAllowedMarks = Math.max(1, Number(chatbotConfig?.maxMarksPerQuestion || 10));
  const [chatMarks, setChatMarks] = useState(Math.min(3, maxAllowedMarks));
  const [chatCount, setChatCount] = useState(Math.min(2, maxAllowedPromptQs));
  const [chatChapterId, setChatChapterId] = useState('all');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedAiQuestionIds, setSelectedAiQuestionIds] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome-ai',
      role: 'assistant',
      text: 'Hello! I am your Multilingual AI Exam Assistant. Choose any language, chapter, and target marks, then ask me to generate questions. Select the generated questions you want (and attach/generate diagrams stored in Firebase Storage) to add them straight into your Question Paper!',
      generatedQuestions: []
    }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const effectiveLanguage =
    paperLanguage === 'Other / Custom Language' && customLanguageName.trim()
      ? customLanguageName.trim()
      : paperLanguage;

  const handleLanguageSwitch = (langName) => {
    setPaperLanguage(langName);
    const preset = SUPPORTED_LANGUAGES.find((l) => l.name === langName);
    if (preset) {
      setPaperDirection(preset.dir);
      if (preset.recommendedFont) {
        setPaperFontFamily(preset.recommendedFont);
      }
    }
  };

  const handleClassChange = (newClassId) => {
    setClassId(newClassId);
    const cls = curriculum.find((c) => c.id === newClassId);
    const firstSub = cls?.subjects?.[0]?.id || '';
    setSubjectId(firstSub);
    setFilterChapterId('all');
    setFilterTopicId('all');
    setChatChapterId('all');
  };

  const handleModelChange = (newModelId) => {
    setMarkingModelId(newModelId);
    const mdl = institution?.markingModels?.find((m) => m.id === newModelId);
    if (mdl) {
      setDuration(mdl.duration);
      if (mdl.sections?.[0]?.title) setTargetSection(mdl.sections[0].title);
    }
  };

  const chapters = selectedSubject?.chapters || [];
  const selectedChapterObj = chapters.find((ch) => ch.id === filterChapterId);
  const topics = selectedChapterObj ? selectedChapterObj.topics : chapters.flatMap((ch) => ch.topics);

  const filteredBankQuestions = questionsBank.filter((q) => {
    if (q.classId !== classId || q.subjectId !== subjectId) return false;
    if (filterChapterId !== 'all' && q.chapterId !== filterChapterId) return false;
    if (filterTopicId !== 'all' && q.topicId !== filterTopicId) return false;
    if (filterMarks !== 'all' && Number(q.marks) !== Number(filterMarks)) return false;
    return true;
  });

  const addQuestionToPaper = (questionItem) => {
    const newItem = {
      ...questionItem,
      id: `${questionItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sectionTitle: targetSection || 'Section A - General',
      source: questionItem.source || 'Question Bank',
      bold: questionItem.bold ?? false,
      italic: questionItem.italic ?? false,
      underline: questionItem.underline ?? false,
      fontSize: questionItem.fontSize || paperFontSize,
      fontFamily: questionItem.fontFamily || '',
      imageData: questionItem.imageData || '',
      imageCaption: questionItem.imageCaption || '',
      imageSize: questionItem.imageSize || 'medium'
    };
    setPaperQuestions((prev) => [...prev, newItem]);
    notify(`Added (${newItem.marks} mark${newItem.marks > 1 ? 's' : ''}) to "${newItem.sectionTitle}"`, 'success');
  };

  const removeQuestionFromPaper = (index) => {
    setPaperQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= paperQuestions.length) return;
    const updated = [...paperQuestions];
    const [removed] = updated.splice(index, 1);
    updated.splice(target, 0, removed);
    setPaperQuestions(updated);
  };

  const updateQuestionField = (index, field, value) => {
    setPaperQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, [field]: value } : q))
    );
  };

  // Upload image directly onto an existing selected question via Firebase Storage
  const handleAttachImageToQuestion = async (index, file) => {
    if (!file) return;
    setUploadingAsset(true);
    try {
      const uploadedUrl = await uploadAssetToCloud(file, 'question-images', file.name);
      updateQuestionField(index, 'imageData', uploadedUrl);
      notify('Image uploaded to Firebase Storage & attached to question!', 'success');
    } catch {
      notify('Could not upload image file.', 'error');
    } finally {
      setUploadingAsset(false);
    }
  };

  // Generate AI Diagram for Top of Paper, Custom Question, AI Chatbot Question, or Selected Paper Question
  const handleGenerateAiDiagram = async ({ targetType, promptText, msgId, qId, paperIdx }) => {
    if (!chatbotConfig?.allowAiImageGeneration) {
      notify('AI Image/Diagram generation is currently disabled by Admin.', 'error');
      return;
    }
    const cleanPrompt = (promptText || '').trim();
    if (!cleanPrompt) {
      notify('Please enter question text or diagram description first.', 'error');
      return;
    }
    const key = qId || (paperIdx !== undefined ? `paper-${paperIdx}` : targetType);
    setGeneratingImgFor(key);
    try {
      const imgUrl = await callGeminiDiagramGenerator(cleanPrompt);
      if (targetType === 'top') {
        setTopImage(imgUrl);
        setShowTopImagePanel(true);
        notify('AI Diagram generated & saved to Top of Question Paper!', 'success');
      } else if (targetType === 'custom') {
        setCustomQ((prev) => ({ ...prev, imageData: imgUrl }));
        notify('AI Diagram generated for your question!', 'success');
      } else if (targetType === 'chat_q') {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  generatedQuestions: m.generatedQuestions.map((gq) =>
                    gq.id === qId ? { ...gq, imageData: imgUrl } : gq
                  )
                }
              : m
          )
        );
        notify('AI Diagram attached to generated question!', 'success');
      } else if (targetType === 'paper_q' && paperIdx !== undefined) {
        updateQuestionField(paperIdx, 'imageData', imgUrl);
        notify('AI Diagram attached to question in paper!', 'success');
      }
    } catch {
      notify('Could not generate diagram right now. You can upload an image file directly.', 'error');
    } finally {
      setGeneratingImgFor(null);
    }
  };

  // Upload image directly to an AI Chatbot generated question before adding to paper
  const handleAttachImageToChatQuestion = async (msgId, qId, file) => {
    if (!file) return;
    setUploadingAsset(true);
    try {
      const uploadedUrl = await uploadAssetToCloud(file, 'question-images', file.name);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                generatedQuestions: m.generatedQuestions.map((gq) =>
                  gq.id === qId ? { ...gq, imageData: uploadedUrl } : gq
                )
              }
            : m
        )
      );
      notify('Image uploaded to Firebase Storage & attached!', 'success');
    } catch {
      notify('Could not read image file.', 'error');
    } finally {
      setUploadingAsset(false);
    }
  };

  // Toggle selection checkbox on AI-generated question
  const toggleAiQuestionSelection = (qId) => {
    setSelectedAiQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  // Add all checked AI-generated questions into the Question Paper
  const handleAddSelectedAiQuestions = (questionsList) => {
    const picked = questionsList.filter((gq) => selectedAiQuestionIds.includes(gq.id));
    if (picked.length === 0) {
      notify('Please select at least one generated question using the checkboxes.', 'error');
      return;
    }
    picked.forEach((gq) => addQuestionToPaper(gq));
    setSelectedAiQuestionIds((prev) => prev.filter((id) => !picked.some((p) => p.id === id)));
    notify(`Added ${picked.length} selected AI question(s) into Question Paper!`, 'success');
  };

  // Add Custom / Image Question directly into paper
  const handleAddCustomQuestion = (e) => {
    e.preventDefault();
    if (!customQ.text.trim() && !customQ.imageData) {
      notify('Please enter question text or upload/generate a question image.', 'error');
      return;
    }
    const opts = customQ.type === 'MCQ'
      ? [customQ.optA, customQ.optB, customQ.optC, customQ.optD].map((o) => o.trim()).filter(Boolean)
      : [];
    const newItem = {
      id: `cust-${Date.now()}`,
      classId,
      subjectId,
      text: customQ.text.trim() || 'Observe the given image carefully and answer the following:',
      type: customQ.type,
      marks: Number(customQ.marks) || 1,
      difficulty: customQ.difficulty,
      bold: customQ.bold,
      italic: customQ.italic,
      underline: customQ.underline,
      fontSize: Number(customQ.fontSize) || paperFontSize,
      fontFamily: customQ.fontFamily || '',
      options: opts,
      answerKey: customQ.answerKey.trim(),
      imageData: customQ.imageData,
      imageCaption: customQ.imageCaption.trim(),
      imageSize: customQ.imageSize,
      source: customQ.imageData ? 'Image / Custom' : 'Custom',
      sectionTitle: targetSection || 'Section A - General'
    };
    setPaperQuestions((prev) => [...prev, newItem]);
    if (customQ.alsoAddToTop && customQ.imageData) {
      setTopImage(customQ.imageData);
      setTopImageCaption(customQ.imageCaption.trim());
      setShowTopImagePanel(true);
    }
    setCustomQ({
      text: '', type: 'Short Answer', marks: 2, difficulty: 'Medium',
      bold: false, italic: false, underline: false, fontSize: paperFontSize, fontFamily: '',
      optA: '', optB: '', optC: '', optD: '', answerKey: '',
      imageData: '', imageCaption: '', imageSize: 'medium',
      alsoAddToTop: false
    });
    notify(`Custom question added to "${newItem.sectionTitle}"!`, 'success');
  };

  // Handle AI Chatbot Submission
  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!isChatbotAllowed) {
      notify('AI Chatbot is currently disabled by the Administrator.', 'error');
      return;
    }
    if (!chatInput.trim() || chatLoading) return;

    const safeCount = Math.min(Number(chatCount), maxAllowedPromptQs);
    const safeMarks = Math.min(Number(chatMarks), maxAllowedMarks);
    const userPrompt = chatInput.trim();
    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: `${userPrompt} [${safeCount} Qs × ${safeMarks} Marks • ${effectiveLanguage}]` };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    const chosenCh = chapters.find((c) => c.id === chatChapterId);
    const contextChapters = chosenCh ? [chosenCh] : chapters;
    const contentSummary = contextChapters.map((ch) => {
      const tNotes = ch.topics.map((t) => `  - Topic: ${t.name}\n    Syllabus Content: ${t.content || 'Standard curriculum'}`).join('\n');
      return `Chapter: ${ch.name}\n${tNotes}`;
    }).join('\n\n');

    const contextInfo = `Class: ${selectedClass?.name || 'General'}
Subject: ${selectedSubject?.name || 'General'}
${contentSummary || 'General academic syllabus'}`;

    try {
      const result = await callGeminiQuestionGenerator({
        prompt: userPrompt,
        contextInfo,
        marks: safeMarks,
        count: safeCount,
        language: effectiveLanguage,
        chatbotConfig
      });

      const generated = (result.questions || []).map((q, i) => ({
        id: `ai-${Date.now()}-${i}`,
        classId,
        subjectId,
        chapterId: chosenCh?.id || chapters[0]?.id || '',
        topicId: chosenCh?.topics?.[0]?.id || '',
        text: q.text,
        marks: Number(q.marks || safeMarks),
        type: q.type || (Number(q.marks) === 1 ? 'MCQ' : 'Short Answer'),
        difficulty: q.difficulty || 'Medium',
        options: Array.isArray(q.options) ? q.options : [],
        answerKey: q.answerKey || '',
        needsImage: Boolean(q.needsImage),
        imagePrompt: q.imagePrompt || '',
        imageData: '',
        imageCaption: '',
        imageSize: 'medium',
        source: 'AI Chatbot'
      }));

      setSelectedAiQuestionIds((prev) => [...prev, ...generated.map((g) => g.id)]);
      if (onChatbotUsage) onChatbotUsage(generated.length);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.replyMessage || `Generated ${generated.length} question(s) in ${effectiveLanguage} for ${safeMarks} marks each. Check the ones you want and click "Add Selected to Paper"!`,
          generatedQuestions: generated
        }
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I encountered a temporary issue connecting to the AI generator. Please try again in a moment.',
          generatedQuestions: []
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalPaperMarks = paperQuestions.reduce((acc, q) => acc + Number(q.marks || 0), 0);
  const targetModelMarks = selectedModel
    ? selectedModel.sections.reduce((acc, s) => acc + Number(s.count) * Number(s.marksPerQ), 0)
    : null;

  const availableSectionNames = selectedModel
    ? selectedModel.sections.map((s) => s.title)
    : ['Section A - Objective', 'Section B - Short Answer', 'Section C - Long Answer'];

  const handleSave = (submitStatus) => {
    if (isQuotaExhausted) {
      notify('Annual quota of 100 question papers exhausted! Institution must renew plan via Admin.', 'error');
      return;
    }
    if (!title.trim()) {
      notify('Please enter a Question Paper Title before saving.', 'error');
      return;
    }
    if (paperQuestions.length === 0) {
      notify('Please add at least one question to the paper.', 'error');
      return;
    }
    const paperPayload = {
      id: editingPaper?.id || `paper-${Date.now()}`,
      institutionId: institution.id,
      createdByRole: currentUser.role,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      title: title.trim(),
      classId,
      subjectId,
      examDate,
      duration,
      language: effectiveLanguage,
      fontFamily: paperFontFamily,
      fontSize: paperFontSize,
      textDirection: paperDirection,
      topImage,
      topImageCaption,
      topImageSize,
      markingModelId,
      markingModelName: selectedModel ? selectedModel.name : 'Custom Layout',
      status: submitStatus,
      reviewNote: editingPaper?.reviewNote || '',
      createdAt: editingPaper?.createdAt || new Date().toISOString().split('T')[0],
      questions: paperQuestions
    };
    if (db && firebaseUser) {
      deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'paperDrafts', draftDocId)).catch(() => {});
    }
    onSavePaper(paperPayload, !editingPaper);
  };

  const draftPaperObj = {
    title: title || 'Untitled Examination Paper',
    classId,
    subjectId,
    examDate,
    duration,
    language: effectiveLanguage,
    fontFamily: paperFontFamily,
    fontSize: paperFontSize,
    textDirection: paperDirection,
    topImage,
    topImageCaption,
    topImageSize,
    markingModelName: selectedModel ? selectedModel.name : 'Custom Layout',
    questions: paperQuestions
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              {editingPaper ? 'Editing Question Paper' : 'New Question Paper Studio'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${remainingQuota <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              Annual Quota: {institution?.papersUsed}/{institution?.annualQuota} Used
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {title || 'Design & Assemble Question Paper'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveWorkspace('chatbot')}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-violet-800 bg-violet-100 hover:bg-violet-200 border border-violet-300 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-violet-600" /> Generate via AI Chatbot
          </button>
          <button
            onClick={() => setShowTopImagePanel(!showTopImagePanel)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border flex items-center gap-1.5 transition ${
              topImage
                ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> {topImage ? 'Top Image Added' : 'Top Paper Image'}
          </button>
          <button
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
          >
            Back
          </button>
          <button
            onClick={() => exportPaperToWord(draftPaperObj, institution, selectedClass?.name || '', selectedSubject?.name || '', showAnswersInPreview, customFonts)}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4" /> Word (.doc)
          </button>
          <button
            onClick={() => exportPaperToPdfPrint(draftPaperObj, institution, selectedClass?.name || '', selectedSubject?.name || '', showAnswersInPreview, customFonts)}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" /> PDF / Print
          </button>
          <button
            disabled={isQuotaExhausted}
            onClick={() => handleSave(currentUser.role === 'faculty' ? 'pending_verification' : 'verified')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-sm flex items-center gap-1.5 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            {currentUser.role === 'faculty' ? 'Save & Submit for Verification' : 'Save & Publish Paper'}
          </button>
        </div>
      </div>

      {isQuotaExhausted && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong>Annual 100-Paper Quota Reached!</strong> Your institution has used all 100 question papers for this year. Please ask your Institution Admin to submit a renewal payment for Admin approval.
          </div>
        </div>
      )}

      {/* Paper Metadata & Marking Model Config */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Question Paper Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mid-Term Science Examination 2026"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
            <select
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {curriculum.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {(selectedClass?.subjects || []).map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Marking Model</label>
            <select
              value={markingModelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {(institution?.markingModels || []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              <option value="custom">Freeform / Custom Model</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Date & Time</label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1.5 Hrs"
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Multilingual & Typography Bar for This Question Paper */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-600" /> Paper Language
            </label>
            <select
              value={paperLanguage}
              onChange={(e) => handleLanguageSwitch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>{lang.name}</option>
              ))}
            </select>
          </div>

          {paperLanguage === 'Other / Custom Language' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Custom Language Name</label>
              <input
                type="text"
                value={customLanguageName}
                onChange={(e) => setCustomLanguageName(e.target.value)}
                placeholder="e.g., Konkani, Odia, Russian"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-indigo-600" /> Paper Font Family
            </label>
            <select
              value={paperFontFamily}
              onChange={(e) => setPaperFontFamily(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
            >
              {allFonts.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Base Font Size: {paperFontSize}px</label>
            <input
              type="range"
              min="11"
              max="22"
              value={paperFontSize}
              onChange={(e) => setPaperFontSize(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Script Direction</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPaperDirection('ltr')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border ${paperDirection === 'ltr' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                LTR (Left → Right)
              </button>
              <button
                type="button"
                onClick={() => setPaperDirection('rtl')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border ${paperDirection === 'rtl' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                RTL (Right → Left)
              </button>
            </div>
          </div>
        </div>

        {/* Blueprint Progress Strip */}
        {targetModelMarks !== null && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              Blueprint Target: <strong>{targetModelMarks} Marks</strong> ({selectedModel.sections.map((s) => `${s.count}×${s.marksPerQ}m`).join(' + ')})
            </span>
            <span className={`font-bold ${totalPaperMarks === targetModelMarks ? 'text-emerald-600' : 'text-amber-600'}`}>
              Current Paper Total: {totalPaperMarks} / {targetModelMarks} Marks
            </span>
          </div>
        )}

        {/* Top-of-Question-Paper Image Attachment / AI Diagram Panel */}
        {showTopImagePanel && (
          <div className="mt-3 pt-3 border-t border-slate-200 bg-indigo-50/50 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" /> Top of Question Paper Image (Stored in Firebase Storage)
              </span>
              <div className="flex items-center gap-2">
                {topImage && (
                  <button
                    type="button"
                    onClick={() => { setTopImage(''); setTopImageCaption(''); }}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove Top Image
                  </button>
                )}
                <button type="button" onClick={() => setShowTopImagePanel(false)} className="text-xs text-slate-500 hover:text-slate-800">
                  Hide
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> {uploadingAsset ? 'Uploading...' : topImage ? 'Replace Image' : 'Upload Top Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingAsset(true);
                    const uploadedUrl = await uploadAssetToCloud(file, 'question-images', file.name);
                    setTopImage(uploadedUrl);
                    setUploadingAsset(false);
                    notify('Image uploaded to Firebase Storage & placed at Top of Paper!', 'success');
                  }}
                />
              </label>

              {chatbotConfig?.allowAiImageGeneration && (
                <button
                  type="button"
                  disabled={generatingImgFor === 'top'}
                  onClick={() => handleGenerateAiDiagram({
                    targetType: 'top',
                    promptText: topImageCaption || `${selectedSubject?.name || 'Science'} exam diagram for ${title || 'question paper'}`
                  })}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {generatingImgFor === 'top' ? 'Generating AI Image...' : 'Generate Top Image with AI'}
                </button>
              )}

              <input
                type="text"
                value={topImageCaption}
                onChange={(e) => setTopImageCaption(e.target.value)}
                placeholder="Caption or AI diagram description (e.g., Fig 1: Ray diagram of concave mirror)"
                className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              />

              <div className="flex items-center gap-1 text-xs">
                {['small', 'medium', 'full'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTopImageSize(sz)}
                    className={`px-2 py-1 rounded-lg capitalize font-semibold border ${topImageSize === sz ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {topImage && (
              <div className="pt-1 flex justify-center">
                <img src={topImage} alt="Top of Paper" className="max-h-36 rounded-lg border border-indigo-200 bg-white p-1 object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'bank', label: '1. Question Bank', icon: BookOpen },
            { id: 'custom_q', label: '2. Image / Custom Q', icon: ImageIcon },
            { id: 'chatbot', label: '3. AI Question Chatbot', icon: Sparkles },
            { id: 'arrange', label: `4. Selected Questions (${paperQuestions.length})`, icon: Layers },
            { id: 'preview', label: '5. Live A4 Preview & Export', icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeWorkspace === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveWorkspace(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Target Section Selector when adding questions */}
        {(activeWorkspace === 'bank' || activeWorkspace === 'chatbot' || activeWorkspace === 'custom_q') && (
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-semibold text-slate-500">Add to Section:</span>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-slate-50"
            >
              {availableSectionNames.map((secName) => (
                <option key={secName} value={secName}>{secName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: QUESTION BANK SELECTOR */}
      {activeWorkspace === 'bank' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Chapter & Topic Syllabus Panel */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              Chapters & Syllabus Contents
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Filter by Chapter</label>
              <select
                value={filterChapterId}
                onChange={(e) => { setFilterChapterId(e.target.value); setFilterTopicId('all'); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="all">All Chapters ({chapters.length})</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Filter by Topic</label>
              <select
                value={filterTopicId}
                onChange={(e) => setFilterTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="all">All Topics ({topics.length})</option>
                {topics.map((tp) => (
                  <option key={tp.id} value={tp.id}>{tp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Filter by Marks</label>
              <div className="flex flex-wrap gap-1.5">
                {['all', 1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMarks(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                      filterMarks === m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'all' ? 'All' : `${m} Mark`}
                  </button>
                ))}
              </div>
            </div>

            {/* Syllabus Topic Reference Notes */}
            <div className="pt-3 border-t border-slate-100 space-y-2 max-h-72 overflow-y-auto">
              <div className="text-xs font-bold text-slate-700">Admin Syllabus Notes:</div>
              {topics.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No topics configured for this subject yet.</p>
              ) : (
                topics.map((tp) => (
                  <div key={tp.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-semibold text-indigo-900">{tp.name}</div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{tp.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Questions List */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Repository Questions ({filteredBankQuestions.length})
              </h3>
              <button
                onClick={() => setActiveWorkspace('chatbot')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Need custom questions? Use AI Chatbot
              </button>
            </div>

            {filteredBankQuestions.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-300 rounded-xl space-y-2">
                <p className="text-sm text-slate-500">No repository questions match this filter.</p>
                <button
                  onClick={() => setActiveWorkspace('chatbot')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate with AI Chatbot
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {filteredBankQuestions.map((q) => (
                  <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                          {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-medium">
                          {q.type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-medium">
                          {q.difficulty}
                        </span>
                        {q.imageData && (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-medium">
                            Has Image
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-900 font-medium leading-snug">{q.text}</p>
                      {q.imageData && (
                        <img src={q.imageData} alt="Question visual" className="h-20 rounded border border-slate-200 bg-white p-1 object-contain" />
                      )}
                      {q.options?.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 text-xs text-slate-600 pt-1">
                          {q.options.map((o, idx) => (
                            <span key={idx}>({String.fromCharCode(97 + idx)}) {o}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => addQuestionToPaper(q)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 self-end sm:self-center transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Paper
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IMAGE QUESTION & CUSTOM FORMATTED QUESTION BUILDER */}
      {activeWorkspace === 'custom_q' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" /> Create Image Question / Custom Multilingual Question
              </h3>
              <p className="text-xs text-slate-500">Write a question in any language, upload a diagram to Firebase Storage, and apply Bold, Italic, Underline, or custom font size.</p>
            </div>
          </div>

          <form onSubmit={handleAddCustomQuestion} className="space-y-4">
            {/* Rich Text Style Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-600 mr-1">Text Formatting:</span>
              <button
                type="button"
                onClick={() => setCustomQ({ ...customQ, bold: !customQ.bold })}
                className={`p-2 rounded-lg border text-xs font-bold ${customQ.bold ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCustomQ({ ...customQ, italic: !customQ.italic })}
                className={`p-2 rounded-lg border text-xs font-bold ${customQ.italic ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCustomQ({ ...customQ, underline: !customQ.underline })}
                className={`p-2 rounded-lg border text-xs font-bold ${customQ.underline ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1" />

              <select
                value={customQ.fontFamily}
                onChange={(e) => setCustomQ({ ...customQ, fontFamily: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="">Use Paper Default Font</option>
                {allFonts.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-semibold">Size:</span>
                <input
                  type="number"
                  min="10"
                  max="28"
                  value={customQ.fontSize}
                  onChange={(e) => setCustomQ({ ...customQ, fontSize: Number(e.target.value) })}
                  className="w-16 px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs"
                />
                <span className="text-slate-400">px</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Question Text (Supports All Languages & Scripts)</label>
              <textarea
                rows={3}
                dir={paperDirection}
                value={customQ.text}
                onChange={(e) => setCustomQ({ ...customQ, text: e.target.value })}
                placeholder="Type your question in Malayalam, Hindi, Tamil, Arabic, English, or any language..."
                style={{
                  fontFamily: customQ.fontFamily ? resolveFontCssFamily(customQ.fontFamily, customFonts) : resolveFontCssFamily(paperFontFamily, customFonts),
                  fontSize: `${customQ.fontSize}px`,
                  fontWeight: customQ.bold ? '700' : '400',
                  fontStyle: customQ.italic ? 'italic' : 'normal',
                  textDecoration: customQ.underline ? 'underline' : 'none'
                }}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Image Upload & AI Diagram Generation Box */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" /> Attach or AI-Generate Diagram / Image (Firebase Storage)
                </label>
                {customQ.imageData && (
                  <button
                    type="button"
                    onClick={() => setCustomQ({ ...customQ, imageData: '', imageCaption: '' })}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> {uploadingAsset ? 'Uploading to Cloud...' : 'Upload Image File'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingAsset(true);
                      const uploadedUrl = await uploadAssetToCloud(file, 'question-images', file.name);
                      setCustomQ({ ...customQ, imageData: uploadedUrl });
                      setUploadingAsset(false);
                      notify('Image uploaded to Firebase Storage!', 'success');
                    }}
                  />
                </label>

                {chatbotConfig?.allowAiImageGeneration && (
                  <button
                    type="button"
                    disabled={generatingImgFor === 'custom'}
                    onClick={() => handleGenerateAiDiagram({
                      targetType: 'custom',
                      promptText: customQ.imageCaption || customQ.text
                    })}
                    className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingImgFor === 'custom' ? 'Generating Diagram...' : 'Generate Image with AI (If Needed)'}
                  </button>
                )}
              </div>

              {customQ.imageData && (
                <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                  <img src={customQ.imageData} alt="Preview" className="h-32 rounded-lg border border-slate-300 bg-white p-1 object-contain" />
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="text"
                      value={customQ.imageCaption}
                      onChange={(e) => setCustomQ({ ...customQ, imageCaption: e.target.value })}
                      placeholder="Image caption (e.g., Fig 1.2 Circuit Diagram)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-600">Print Size:</span>
                        {['small', 'medium', 'large'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setCustomQ({ ...customQ, imageSize: sz })}
                            className={`px-2.5 py-1 rounded-lg capitalize font-semibold border ${customQ.imageSize === sz ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-1.5 font-semibold text-indigo-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customQ.alsoAddToTop}
                          onChange={(e) => setCustomQ({ ...customQ, alsoAddToTop: e.target.checked })}
                          className="rounded text-indigo-600"
                        />
                        Also place image at Top of Question Paper
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Question Type</label>
                <select
                  value={customQ.type}
                  onChange={(e) => setCustomQ({ ...customQ, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="MCQ">MCQ (Objective)</option>
                  <option value="Short Answer">Short Answer</option>
                  <option value="Long Answer">Long Answer</option>
                  <option value="Diagram / Image Based">Diagram / Image Based</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Marks</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={customQ.marks}
                  onChange={(e) => setCustomQ({ ...customQ, marks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                <select
                  value={customQ.difficulty}
                  onChange={(e) => setCustomQ({ ...customQ, difficulty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {customQ.type === 'MCQ' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input type="text" value={customQ.optA} onChange={(e) => setCustomQ({ ...customQ, optA: e.target.value })} placeholder="Option (a)" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
                <input type="text" value={customQ.optB} onChange={(e) => setCustomQ({ ...customQ, optB: e.target.value })} placeholder="Option (b)" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
                <input type="text" value={customQ.optC} onChange={(e) => setCustomQ({ ...customQ, optC: e.target.value })} placeholder="Option (c)" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
                <input type="text" value={customQ.optD} onChange={(e) => setCustomQ({ ...customQ, optD: e.target.value })} placeholder="Option (d)" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Marking Key / Answer Hint (Optional)</label>
              <input
                type="text"
                value={customQ.answerKey}
                onChange={(e) => setCustomQ({ ...customQ, answerKey: e.target.value })}
                placeholder="Answer key for teachers..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition">
              <Plus className="w-4 h-4" /> Add Question to "{targetSection}"
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: AI QUESTION CHATBOT */}
      {activeWorkspace === 'chatbot' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[660px]">
          {!isChatbotAllowed ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">AI Question Chatbot Disabled by Administrator</h3>
              <p className="text-sm text-slate-500 max-w-md">
                The System Administrator has restricted AI Chatbot access for your portal or institution. You can still build papers using the Question Bank and Custom/Image Questions.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Multilingual AI Question Generator</h3>
                    <p className="text-[11px] text-indigo-200">
                      {selectedClass?.name} • {selectedSubject?.name} • Language: <strong>{effectiveLanguage}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={paperLanguage}
                    onChange={(e) => setPaperLanguage(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 border border-white/20 text-white outline-none max-w-[140px]"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.name} value={l.name} className="text-slate-900">{l.name}</option>
                    ))}
                  </select>
                  <select
                    value={chatChapterId}
                    onChange={(e) => setChatChapterId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 border border-white/20 text-white outline-none"
                  >
                    <option value="all" className="text-slate-900">All Chapters</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id} className="text-slate-900">{ch.name}</option>
                    ))}
                  </select>
                  <select
                    value={chatMarks}
                    onChange={(e) => setChatMarks(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 border border-white/20 text-white outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].filter((m) => m <= maxAllowedMarks).map((m) => (
                      <option key={m} value={m} className="text-slate-900">{m} {m === 1 ? 'Mark' : 'Marks'}</option>
                    ))}
                  </select>
                  <select
                    value={chatCount}
                    onChange={(e) => setChatCount(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 border border-white/20 text-white outline-none"
                  >
                    {Array.from({ length: maxAllowedPromptQs }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c} className="text-slate-900">{c} {c === 1 ? 'Question' : 'Questions'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatMessages.map((msg) => {
                  const selectedInBatch = (msg.generatedQuestions || []).filter((gq) => selectedAiQuestionIds.includes(gq.id)).length;
                  return (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[95%] sm:max-w-[86%] space-y-2.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-violet-100 text-violet-700'
                          }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                        </div>

                        {msg.generatedQuestions && msg.generatedQuestions.length > 0 && (
                          <div className="pl-2 sm:pl-9 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-violet-50 border border-violet-200 px-3 py-2 rounded-xl">
                              <span className="text-xs font-bold text-violet-900">
                                Select Generated Questions ({selectedInBatch}/{msg.generatedQuestions.length} selected)
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const batchIds = msg.generatedQuestions.map((g) => g.id);
                                    const allSelected = batchIds.every((id) => selectedAiQuestionIds.includes(id));
                                    if (allSelected) {
                                      setSelectedAiQuestionIds((prev) => prev.filter((id) => !batchIds.includes(id)));
                                    } else {
                                      setSelectedAiQuestionIds((prev) => Array.from(new Set([...prev, ...batchIds])));
                                    }
                                  }}
                                  className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100"
                                >
                                  {msg.generatedQuestions.every((g) => selectedAiQuestionIds.includes(g.id)) ? 'Deselect All' : 'Select All'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddSelectedAiQuestions(msg.generatedQuestions)}
                                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Add Selected ({selectedInBatch}) to Paper
                                </button>
                              </div>
                            </div>

                            {msg.generatedQuestions.map((gq) => {
                              const isChecked = selectedAiQuestionIds.includes(gq.id);
                              return (
                                <div
                                  key={gq.id}
                                  className={`bg-white p-3.5 rounded-xl border shadow-sm space-y-2.5 transition ${
                                    isChecked ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-violet-200'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleAiQuestionSelection(gq.id)}
                                        className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                        title="Select question to add to paper"
                                      />
                                      <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-[11px] font-bold">
                                        {gq.marks} {gq.marks === 1 ? 'Mark' : 'Marks'}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                                        {gq.type}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium">
                                        {gq.difficulty}
                                      </span>
                                      {gq.needsImage && !gq.imageData && (
                                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                                          Diagram Recommended
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <label className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer flex items-center gap-1">
                                        <Upload className="w-3 h-3" /> {gq.imageData ? 'Change Img' : 'Upload Img'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleAttachImageToChatQuestion(msg.id, gq.id, e.target.files?.[0])}
                                        />
                                      </label>

                                      {chatbotConfig?.allowAiImageGeneration && (
                                        <button
                                          type="button"
                                          disabled={generatingImgFor === gq.id}
                                          onClick={() => handleGenerateAiDiagram({
                                            targetType: 'chat_q',
                                            promptText: gq.imagePrompt || gq.text,
                                            msgId: msg.id,
                                            qId: gq.id
                                          })}
                                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-semibold flex items-center gap-1"
                                        >
                                          <ImageIcon className="w-3 h-3" />
                                          {generatingImgFor === gq.id ? 'Generating...' : 'AI Image'}
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => addQuestionToPaper(gq)}
                                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Add
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-sm text-slate-900 font-medium">{gq.text}</p>

                                  {gq.imageData && (
                                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200">
                                      <img src={gq.imageData} alt="Question diagram" className="h-24 rounded border border-slate-200 bg-white object-contain" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTopImage(gq.imageData);
                                          setShowTopImagePanel(true);
                                          notify('Copied image to Top of Question Paper!', 'success');
                                        }}
                                        className="text-xs font-semibold text-indigo-700 hover:underline"
                                      >
                                        + Also place at Top of Paper
                                      </button>
                                    </div>
                                  )}

                                  {gq.options?.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                                      {gq.options.map((o, i) => <div key={i}>({String.fromCharCode(97 + i)}) {o}</div>)}
                                    </div>
                                  )}
                                  {gq.answerKey && (
                                    <div className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                                      <strong>Key:</strong> {gq.answerKey}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="flex items-center gap-2.5 text-xs text-indigo-700 bg-white px-4 py-3 rounded-2xl border border-indigo-100 w-fit shadow-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating {chatCount} tailored {chatMarks}-mark question(s) in {effectiveLanguage}...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    `Create ${chatCount} application-based questions of ${chatMarks} marks in ${effectiveLanguage}`,
                    `Generate ${chatCount} diagram-based questions with clear visual descriptions`,
                    `Create ${chatCount} conceptual MCQ questions for quick revision`
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setChatInput(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask AI to create ${chatMarks}-mark questions in ${effectiveLanguage}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-1.5 transition"
                  >
                    <Send className="w-4 h-4" /> Generate
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: SELECTED QUESTIONS & SECTION ORGANIZER + PER-QUESTION FORMATTING */}
      {activeWorkspace === 'arrange' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900">Selected Paper Questions & Formatting ({paperQuestions.length})</h3>
              <p className="text-xs text-slate-500">Reorder questions, customize Bold/Italic/Underline/Font size, or attach/AI-generate images stored in Firebase Storage.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
              Total Marks: {totalPaperMarks}
            </span>
          </div>

          {paperQuestions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">
              Your paper is empty. Go to <strong>Question Bank</strong>, <strong>Image / Custom Q</strong>, or <strong>AI Question Chatbot</strong> to add questions.
            </div>
          ) : (
            <div className="space-y-3">
              {paperQuestions.map((q, idx) => (
                <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={q.sectionTitle}
                            onChange={(e) => updateQuestionField(idx, 'sectionTitle', e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-indigo-900"
                            placeholder="Section Title"
                          />
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            q.source === 'AI Chatbot' ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {q.source}
                          </span>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-500">Marks:</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={q.marks}
                              onChange={(e) => updateQuestionField(idx, 'marks', Number(e.target.value))}
                              className="w-14 px-2 py-0.5 rounded border border-slate-300 text-xs font-bold text-center bg-white"
                            />
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => updateQuestionField(idx, 'text', e.target.value)}
                          style={{
                            fontWeight: q.bold ? '700' : '400',
                            fontStyle: q.italic ? 'italic' : 'normal',
                            textDecoration: q.underline ? 'underline' : 'none',
                            fontSize: `${q.fontSize || paperFontSize}px`
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => moveQuestion(idx, -1)}
                        disabled={idx === 0}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold disabled:opacity-40 hover:bg-slate-100"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestion(idx, 1)}
                        disabled={idx === paperQuestions.length - 1}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold disabled:opacity-40 hover:bg-slate-100"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeQuestionFromPaper(idx)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Per-Question Typography & Image Controls */}
                  <div className="pl-10 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => updateQuestionField(idx, 'bold', !q.bold)}
                      className={`p-1.5 rounded border text-xs ${q.bold ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuestionField(idx, 'italic', !q.italic)}
                      className={`p-1.5 rounded border text-xs ${q.italic ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuestionField(idx, 'underline', !q.underline)}
                      className={`p-1.5 rounded border text-xs ${q.underline ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500">Size:</span>
                      <input
                        type="number"
                        min="10"
                        max="28"
                        value={q.fontSize || paperFontSize}
                        onChange={(e) => updateQuestionField(idx, 'fontSize', Number(e.target.value))}
                        className="w-14 px-1.5 py-1 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <label className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer hover:bg-indigo-100 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> {q.imageData ? 'Change Image' : 'Add Image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAttachImageToQuestion(idx, e.target.files?.[0])}
                      />
                    </label>

                    {chatbotConfig?.allowAiImageGeneration && (
                      <button
                        type="button"
                        disabled={generatingImgFor === `paper-${idx}`}
                        onClick={() => handleGenerateAiDiagram({
                          targetType: 'paper_q',
                          promptText: q.imagePrompt || q.text,
                          paperIdx: idx
                        })}
                        className="px-2.5 py-1 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {generatingImgFor === `paper-${idx}` ? 'Generating...' : 'AI Diagram'}
                      </button>
                    )}

                    {q.imageData && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setTopImage(q.imageData);
                            setShowTopImagePanel(true);
                            notify('Image also placed at Top of Question Paper!', 'success');
                          }}
                          className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100"
                        >
                          Place at Top
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQuestionField(idx, 'imageData', '')}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100"
                        >
                          Remove Img
                        </button>
                      </>
                    )}
                  </div>

                  {q.imageData && (
                    <div className="pl-10 flex items-center gap-3">
                      <img src={q.imageData} alt="Attached" className="h-20 rounded border border-slate-300 bg-white p-1 object-contain" />
                      <input
                        type="text"
                        value={q.imageCaption || ''}
                        onChange={(e) => updateQuestionField(idx, 'imageCaption', e.target.value)}
                        placeholder="Optional caption for image..."
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white flex-1 max-w-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LIVE A4 PREVIEW & DOWNLOAD */}
      {activeWorkspace === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnswersInPreview}
                onChange={(e) => setShowAnswersInPreview(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              Include Answer Key / Marking Scheme in Preview & Downloads
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => exportPaperToWord(draftPaperObj, institution, selectedClass?.name || '', selectedSubject?.name || '', showAnswersInPreview, customFonts)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Word File (.doc)
              </button>
              <button
                onClick={() => exportPaperToPdfPrint(draftPaperObj, institution, selectedClass?.name || '', selectedSubject?.name || '', showAnswersInPreview, customFonts)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Download / Print PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-200/70 p-4 sm:p-8 rounded-2xl overflow-x-auto">
            <PaperPreviewCanvas
              paper={draftPaperObj}
              institution={institution}
              className={selectedClass?.name || ''}
              subjectName={selectedSubject?.name || ''}
              showAnswers={showAnswersInPreview}
              customFonts={customFonts}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Cloud Auth & Sync Status
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting');

  // Core Persistent State (Backed by Cloud Firestore & Firebase Storage)
  const [institutions, setInstitutions] = useState(INITIAL_INSTITUTIONS);
  const [faculties, setFaculties] = useState(INITIAL_FACULTIES);
  const [curriculum, setCurriculum] = useState(INITIAL_CURRICULUM);
  const [questionsBank, setQuestionsBank] = useState(INITIAL_QUESTIONS_BANK);
  const [papers, setPapers] = useState(INITIAL_PAPERS);
  const [renewalRequests, setRenewalRequests] = useState(INITIAL_RENEWAL_REQUESTS);
  const [customFonts, setCustomFonts] = useState([]);
  const [chatbotConfig, setChatbotConfig] = useState(DEFAULT_CHATBOT_CONFIG);

  // Admin Credentials (Can also be updated)
  const [adminCreds, setAdminCreds] = useState({
    id: 'admin-1',
    name: 'System Super Admin',
    email: 'admin@examcraft.com',
    password: 'admin123'
  });

  // Step 1: Authenticate with Firebase Auth Before Any Data Operations
  useEffect(() => {
    if (!auth) {
      setSyncStatus('offline');
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Firebase authentication failed:', err);
        setSyncStatus('offline');
      }
    };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) setSyncStatus('saved');
    });
    return () => unsubAuth();
  }, []);

  // Step 2: Seed Initial Data Once (If Empty) & Subscribe to Real-Time Cloud Firestore Sync
  useEffect(() => {
    if (!db || !firebaseUser) return;

    const seedIfNeeded = async () => {
      try {
        const seedRef = doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'seedStatus');
        const seedSnap = await getDoc(seedRef);
        if (!seedSnap.exists()) {
          setSyncStatus('saving');
          await Promise.all([
            ...INITIAL_INSTITUTIONS.map((inst) =>
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'institutions', inst.id), inst)
            ),
            ...INITIAL_FACULTIES.map((fac) =>
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'faculties', fac.id), fac)
            ),
            ...INITIAL_CURRICULUM.map((cls) =>
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'curriculum', cls.id), cls)
            ),
            ...INITIAL_QUESTIONS_BANK.map((q) =>
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'questionsBank', q.id), q)
            ),
            ...INITIAL_PAPERS.map((p) =>
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'papers', p.id), p)
            ),
            ...INITIAL_RENEWAL_REQUESTS.map((r) =>
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'renewalRequests', r.id), r)
            ),
            setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'globalConfig'), {
              chatbotConfig: DEFAULT_CHATBOT_CONFIG,
              adminCreds: {
                id: 'admin-1',
                name: 'System Super Admin',
                email: 'admin@examcraft.com',
                password: 'admin123'
              }
            }),
            setDoc(seedRef, { seeded: true, seededAt: new Date().toISOString() })
          ]);
          setSyncStatus('saved');
        }
      } catch (err) {
        console.error('Initial data seed error:', err);
      }
    };

    seedIfNeeded();

    const unsubInst = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'institutions'),
      (snap) => {
        if (!snap.empty) {
          setInstitutions(snap.docs.map((d) => d.data()));
        }
      },
      (err) => console.error('Institutions sync error:', err)
    );

    const unsubFac = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'faculties'),
      (snap) => {
        if (!snap.empty) {
          setFaculties(snap.docs.map((d) => d.data()));
        }
      },
      (err) => console.error('Faculties sync error:', err)
    );

    const unsubCurr = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'curriculum'),
      (snap) => {
        if (!snap.empty) {
          setCurriculum(snap.docs.map((d) => d.data()));
        }
      },
      (err) => console.error('Curriculum sync error:', err)
    );

    const unsubQBank = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'questionsBank'),
      (snap) => {
        setQuestionsBank(snap.docs.map((d) => d.data()));
      },
      (err) => console.error('QuestionsBank sync error:', err)
    );

    const unsubPapers = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'papers'),
      (snap) => {
        const list = snap.docs.map((d) => d.data());
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setPapers(list);
      },
      (err) => console.error('Papers sync error:', err)
    );

    const unsubRenewals = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'renewalRequests'),
      (snap) => {
        setRenewalRequests(snap.docs.map((d) => d.data()));
      },
      (err) => console.error('Renewals sync error:', err)
    );

    const unsubFonts = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'customFonts'),
      (snap) => {
        setCustomFonts(snap.docs.map((d) => d.data()));
      },
      (err) => console.error('CustomFonts sync error:', err)
    );

    const unsubConfig = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'globalConfig'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.chatbotConfig) setChatbotConfig(data.chatbotConfig);
          if (data.adminCreds) setAdminCreds(data.adminCreds);
        }
      },
      (err) => console.error('Config sync error:', err)
    );

    return () => {
      unsubInst();
      unsubFac();
      unsubCurr();
      unsubQBank();
      unsubPapers();
      unsubRenewals();
      unsubFonts();
      unsubConfig();
    };
  }, [firebaseUser]);

  // Autosave Persistence Helpers
  const persistDoc = async (colName, docId, payload) => {
    if (!db || !firebaseUser) return;
    try {
      setSyncStatus('saving');
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, docId), payload);
      setSyncStatus('saved');
    } catch (err) {
      console.error(`Autosave failed for ${colName}/${docId}:`, err);
      setSyncStatus('offline');
    }
  };

  const removeDocFromCloud = async (colName, docId) => {
    if (!db || !firebaseUser) return;
    try {
      setSyncStatus('saving');
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, docId));
      setSyncStatus('saved');
    } catch (err) {
      console.error(`Delete failed for ${colName}/${docId}:`, err);
    }
  };

  const persistGlobalConfig = async (nextChatbotConfig, nextAdminCreds = adminCreds) => {
    if (!db || !firebaseUser) return;
    try {
      setSyncStatus('saving');
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'globalConfig'), {
        chatbotConfig: nextChatbotConfig,
        adminCreds: nextAdminCreds
      });
      setSyncStatus('saved');
    } catch (err) {
      console.error('Config autosave error:', err);
    }
  };

  // Sync authenticated Firebase Auth user's role profile in Firestore for Security Rules
  const syncUserSecurityProfile = async (profilePayload) => {
    if (!db || !auth?.currentUser) return;
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'userProfiles', auth.currentUser.uid),
        {
          uid: auth.currentUser.uid,
          ...profilePayload,
          lastLoginAt: new Date().toISOString()
        }
      );
    } catch (err) {
      console.warn('Security profile sync note:', err?.message);
    }
  };

  // Auth & Navigation State
  const [currentUser, setCurrentUser] = useState(null);
  const [loginRole, setLoginRole] = useState('admin');
  const [loginEmail, setLoginEmail] = useState('admin@examcraft.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Section per Role
  const [activeTab, setActiveTab] = useState('dashboard');

  // Toast Notification Banner
  const [toast, setToast] = useState(null);
  const notify = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Paper Builder & Modal Preview States
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [previewModalPaper, setPreviewModalPaper] = useState(null);

  // Admin Forms State
  const [newInst, setNewInst] = useState({ name: '', code: '', email: '', password: '' });
  const [admClassId, setAdmClassId] = useState(INITIAL_CURRICULUM[0].id);
  const [admSubjectId, setAdmSubjectId] = useState(INITIAL_CURRICULUM[0].subjects[0].id);
  const [admChapterId, setAdmChapterId] = useState(INITIAL_CURRICULUM[0].subjects[0].chapters[0].id);
  const [admTopicId, setAdmTopicId] = useState(INITIAL_CURRICULUM[0].subjects[0].chapters[0].topics[0].id);

  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newBankQ, setNewBankQ] = useState({
    type: 'Short Answer', marks: 2, difficulty: 'Medium', text: '',
    optA: '', optB: '', optC: '', optD: '', answerKey: '', imageData: ''
  });
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Institution Forms State
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', password: '', department: '' });
  const [renewalPaymentRef, setRenewalPaymentRef] = useState('');
  const [renewalAmount, setRenewalAmount] = useState('4999');
  const [newModelForm, setNewModelForm] = useState({
    name: '',
    duration: '1 Hour 30 Mins',
    sections: [
      { id: 'ns-1', title: 'Section A - Objective', count: 5, marksPerQ: 1 },
      { id: 'ns-2', title: 'Section B - Descriptive', count: 5, marksPerQ: 4 }
    ]
  });
  const [newCustomFontName, setNewCustomFontName] = useState('');
  const [newGoogleFontName, setNewGoogleFontName] = useState('');

  // Inject Google Fonts & Custom Uploaded @font-face styles dynamically into <head>
  useEffect(() => {
    const styleId = 'examcraft-dynamic-fonts';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const googleImports = BUILTIN_FONTS
      .filter((f) => f.googleFamily)
      .map((f) => `@import url('https://fonts.googleapis.com/css2?family=${f.googleFamily}&display=swap');`)
      .join('\n');

    const customGoogleImports = customFonts
      .filter((f) => f.googleFamily)
      .map((f) => `@import url('https://fonts.googleapis.com/css2?family=${f.googleFamily}&display=swap');`)
      .join('\n');

    const customFaces = customFonts
      .filter((f) => f.dataUrl)
      .map((f) => `@font-face { font-family: "${f.name}"; src: url("${f.dataUrl}"); }`)
      .join('\n');

    styleEl.textContent = `${googleImports}\n${customGoogleImports}\n${customFaces}`;
  }, [customFonts]);

  // Switch Login Role Helper
  const selectLoginPreset = (role, email, password) => {
    setLoginRole(role);
    setLoginEmail(email);
    setLoginPassword(password);
    setLoginError('');
  };

  // Handle Login Submission (Supports Firebase Email/Password Auth + Role Profile Verification)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const normalizedEmail = loginEmail.trim().toLowerCase();

    // Attempt native Firebase Email/Password Auth if configured in Firebase Console
    if (auth && normalizedEmail && loginPassword) {
      try {
        await signInWithEmailAndPassword(auth, normalizedEmail, loginPassword);
      } catch {
        // Fallback to demo/managed credentials when native Email/Password user is not provisioned yet
      }
    }

    if (loginRole === 'admin') {
      if (normalizedEmail === adminCreds.email.toLowerCase() && loginPassword === adminCreds.password) {
        const userObj = { id: adminCreds.id, role: 'admin', name: adminCreds.name, email: adminCreds.email };
        setCurrentUser(userObj);
        syncUserSecurityProfile({ role: 'admin', email: adminCreds.email, status: 'active' });
        setActiveTab('dashboard');
        setBuilderOpen(false);
        return;
      }
      setLoginError('Invalid Admin email or password.');
      return;
    }

    if (loginRole === 'institution') {
      const found = institutions.find(
        (inst) => inst.email.toLowerCase() === normalizedEmail && inst.password === loginPassword
      );
      if (!found) {
        setLoginError('Invalid Institution credentials.');
        return;
      }
      if (found.status !== 'active') {
        setLoginError('This Institution login has been suspended by the Administrator.');
        return;
      }
      const userObj = {
        id: found.id,
        role: 'institution',
        name: found.name,
        email: found.email,
        institutionId: found.id
      };
      setCurrentUser(userObj);
      syncUserSecurityProfile({ role: 'institution', institutionId: found.id, email: found.email, status: found.status });
      setActiveTab('dashboard');
      setBuilderOpen(false);
      return;
    }

    if (loginRole === 'faculty') {
      const foundFac = faculties.find(
        (f) => f.email.toLowerCase() === normalizedEmail && f.password === loginPassword
      );
      if (!foundFac) {
        setLoginError('Invalid Faculty credentials.');
        return;
      }
      if (foundFac.status !== 'active') {
        setLoginError('Your Faculty login is suspended. Contact your Institution or Admin.');
        return;
      }
      const parentInst = institutions.find((i) => i.id === foundFac.institutionId);
      if (!parentInst || parentInst.status !== 'active') {
        setLoginError('Your parent Institution account is currently suspended.');
        return;
      }
      const userObj = {
        id: foundFac.id,
        role: 'faculty',
        name: foundFac.name,
        email: foundFac.email,
        institutionId: foundFac.institutionId,
        department: foundFac.department
      };
      setCurrentUser(userObj);
      syncUserSecurityProfile({ role: 'faculty', institutionId: foundFac.institutionId, email: foundFac.email, status: foundFac.status });
      setActiveTab('dashboard');
      setBuilderOpen(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBuilderOpen(false);
    setEditingPaper(null);
    setMobileMenuOpen(false);
  };

  // Active Institution context for Institution / Faculty roles
  const activeInstitution =
    currentUser?.role === 'institution'
      ? institutions.find((i) => i.id === currentUser.id)
      : currentUser?.role === 'faculty'
      ? institutions.find((i) => i.id === currentUser.institutionId)
      : null;

  // Save Question Paper (and increment institution annual quota if new)
  const handleSavePaper = (paperPayload, isNew) => {
    persistDoc('papers', paperPayload.id, paperPayload);
    if (isNew) {
      setPapers((prev) => [paperPayload, ...prev]);
      setInstitutions((prev) =>
        prev.map((inst) => {
          if (inst.id === paperPayload.institutionId) {
            const updatedInst = { ...inst, papersUsed: inst.papersUsed + 1 };
            persistDoc('institutions', updatedInst.id, updatedInst);
            return updatedInst;
          }
          return inst;
        })
      );
      notify(
        currentUser.role === 'faculty'
          ? 'Question paper autosaved & sent to Institution for verification!'
          : 'Question paper published & autosaved! 1 quota credit used.',
        'success'
      );
    } else {
      setPapers((prev) => prev.map((p) => (p.id === paperPayload.id ? paperPayload : p)));
      notify('Question paper changes autosaved!', 'success');
    }
    setBuilderOpen(false);
    setEditingPaper(null);
  };

  // ==========================================================================
  // RENDER: LOGIN PORTAL (3 ROLE TABS + ONE-CLICK DEMO ACCESS)
  // ==========================================================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {/* Left Branding & Capabilities Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 text-white p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">ExamCraft Studio</h1>
                  <p className="text-[11px] text-indigo-200">Firebase Auth • Firestore • Cloud Storage</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold mt-7 leading-snug">
                Smart Question Paper Design & Syllabus Engine
              </h2>
              <p className="text-xs text-indigo-100 mt-2.5 leading-relaxed">
                Complete multi-role examination workflow backed by Firebase Authentication, Cloud Firestore real-time autosave, and Firebase Storage.
              </p>

              <div className="mt-6 space-y-3 text-xs">
                <div className="flex items-start gap-2.5 bg-white/10 p-3 rounded-xl">
                  <Shield className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white">Admin Governance & Security</strong>
                    <span className="text-indigo-200">Control all logins, AI Chatbot rules, manage Class → Subject → Chapter → Topic bank, & approve plan renewals.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-white/10 p-3 rounded-xl">
                  <Building2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white">Institution Portal (100 Papers/Yr)</strong>
                    <span className="text-indigo-200">Design custom paper layouts, logos, watermarks, marking models, & verify faculty papers.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-white/10 p-3 rounded-xl">
                  <GraduationCap className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white">Faculty & Multilingual AI Chatbot</strong>
                    <span className="text-indigo-200">Pick chapter questions, generate mark-based questions via AI Chatbot, add images, & export Word/PDF.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/15 text-[11px] text-indigo-200 flex items-center justify-between">
              <span>Firestore + Storage + Auth</span>
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                <Cloud className="w-3.5 h-3.5" /> {firebaseUser ? 'Firebase Connected' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Right Login Form Column */}
          <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Firebase Secured Portal</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Select Your Login Role</h3>
            </div>

            {/* 3 Role Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
              {[
                { id: 'admin', label: 'Admin', icon: Shield, email: 'admin@examcraft.com', pass: 'admin123' },
                { id: 'institution', label: 'Institution', icon: Building2, email: 'inst@xaviers.edu', pass: 'inst123' },
                { id: 'faculty', label: 'Faculty', icon: GraduationCap, email: 'arun@xaviers.edu', pass: 'fac123' }
              ].map((item) => {
                const Icon = item.icon;
                const active = loginRole === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectLoginPreset(item.id, item.email, item.pass)}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                      active
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter your login email"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition"
              >
                Sign In as {loginRole === 'admin' ? 'Administrator' : loginRole === 'institution' ? 'Institution' : 'Faculty'}
              </button>
            </form>

            {/* Quick Demo Credentials Box */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Quick Demo Accounts (Click to Autofill)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => selectLoginPreset('admin', 'admin@examcraft.com', 'admin123')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-bold text-slate-800">Admin Login</div>
                  <div className="text-slate-500 text-[11px]">admin@examcraft.com / admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => selectLoginPreset('institution', 'inst@xaviers.edu', 'inst123')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-bold text-slate-800">Institution (Active 14/100)</div>
                  <div className="text-slate-500 text-[11px]">inst@xaviers.edu / inst123</div>
                </button>
                <button
                  type="button"
                  onClick={() => selectLoginPreset('institution', 'inst@malabar.edu', 'inst123')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition"
                >
                  <div className="font-bold text-amber-800">Institution (Near Limit 99/100)</div>
                  <div className="text-slate-500 text-[11px]">inst@malabar.edu / inst123</div>
                </button>
                <button
                  type="button"
                  onClick={() => selectLoginPreset('faculty', 'arun@xaviers.edu', 'fac123')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-bold text-slate-800">Faculty (Dr. Arun Menon)</div>
                  <div className="text-slate-500 text-[11px]">arun@xaviers.edu / fac123</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // NAVIGATION MENU ITEMS BY ROLE
  // ==========================================================================

  const navItems = currentUser.role === 'admin'
    ? [
        { id: 'dashboard', label: 'Admin Overview', icon: Shield },
        { id: 'institutions', label: 'Institutions & Renewals', icon: Building2, badge: renewalRequests.filter((r) => r.status === 'pending').length || null },
        { id: 'curriculum', label: 'Syllabus & Question Bank', icon: FolderTree },
        { id: 'chatbot_control', label: 'AI Chatbot Control', icon: Bot },
        { id: 'logins', label: 'All Logins Control', icon: Users }
      ]
    : currentUser.role === 'institution'
    ? [
        { id: 'dashboard', label: 'Institution Overview', icon: Building2 },
        { id: 'papers', label: 'Question Papers', icon: FileText },
        { id: 'verify', label: 'Verify Faculty Papers', icon: FileCheck2, badge: papers.filter((p) => p.institutionId === activeInstitution?.id && p.status === 'pending_verification').length || null },
        { id: 'layout', label: 'Paper Layout & Marking', icon: Layout },
        { id: 'faculties', label: 'Faculty Logins', icon: GraduationCap },
        { id: 'quota', label: 'Quota & Plan Renewal', icon: CreditCard }
      ]
    : [
        { id: 'dashboard', label: 'Faculty Workspace', icon: GraduationCap },
        { id: 'papers', label: 'My Question Papers', icon: FileText },
        { id: 'syllabus', label: 'Syllabus & Question Bank', icon: BookOpen }
      ];

  // ==========================================================================
  // ADMIN CURRICULUM SELECTORS HELPERS
  // ==========================================================================
  const admClass = curriculum.find((c) => c.id === admClassId) || curriculum[0];
  const admSubject = admClass?.subjects.find((s) => s.id === admSubjectId) || admClass?.subjects[0];
  const admChapter = admSubject?.chapters.find((ch) => ch.id === admChapterId) || admSubject?.chapters[0];
  const admTopic = admChapter?.topics.find((t) => t.id === admTopicId) || admChapter?.topics[0];

  // ==========================================================================
  // RENDER: AUTHENTICATED APPLICATION SHELL
  // ==========================================================================

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-bounce ${
          toast.type === 'error' ? 'bg-rose-600' : toast.type === 'success' ? 'bg-emerald-600' : 'bg-indigo-700'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-indigo-950 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-300" />
          <span className="font-extrabold text-base">ExamCraft Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg bg-white/10">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:flex flex-col w-full lg:w-68 bg-slate-900 text-slate-200 shrink-0 lg:min-h-screen p-4 justify-between`}>
        <div>
          <div className="hidden lg:flex items-center gap-2.5 px-2 py-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-extrabold text-white text-base leading-tight">ExamCraft Studio</div>
              <div className="text-[11px] text-slate-400 capitalize">{currentUser.role} Portal</div>
            </div>
          </div>

          {/* Current User Profile Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/70 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
              </div>
            </div>
            {activeInstitution && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="truncate">{activeInstitution.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold ml-1">
                  {activeInstitution.papersUsed}/{activeInstitution.annualQuota}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = !builderOpen && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setBuilderOpen(false); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white text-xs sm:text-sm font-bold transition"
        >
          <LogOut className="w-4 h-4" />
          Logout ({currentUser.role})
        </button>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Persistent Top Portal Bar with Logout Option on Every Page */}
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-extrabold uppercase tracking-wide">
              {currentUser.role} Login
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Welcome, <strong>{currentUser.name}</strong>
              {activeInstitution ? ` • ${activeInstitution.name}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                syncStatus === 'saving'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : syncStatus === 'offline'
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              title="All work is automatically saved to Firebase Firestore & Storage."
            >
              {syncStatus === 'saving' ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Syncing Firebase...</>
              ) : syncStatus === 'offline' ? (
                <><CloudOff className="w-3 h-3" /> Local Session</>
              ) : (
                <><Database className="w-3 h-3" /> Firebase Autosaved</>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* IF PAPER BUILDER IS OPEN */}
        {builderOpen && activeInstitution ? (
          <QuestionPaperBuilder
            currentUser={currentUser}
            institution={activeInstitution}
            curriculum={curriculum}
            questionsBank={questionsBank}
            customFonts={customFonts}
            chatbotConfig={chatbotConfig}
            onChatbotUsage={(generatedCount) => {
              setChatbotConfig((prev) => {
                const nextCfg = {
                  ...prev,
                  totalPromptsRun: (prev.totalPromptsRun || 0) + 1,
                  totalQuestionsGenerated: (prev.totalQuestionsGenerated || 0) + generatedCount
                };
                persistGlobalConfig(nextCfg);
                return nextCfg;
              });
            }}
            firebaseUser={firebaseUser}
            onSyncStatusChange={setSyncStatus}
            editingPaper={editingPaper}
            onSavePaper={handleSavePaper}
            onCancel={() => { setBuilderOpen(false); setEditingPaper(null); }}
            notify={notify}
          />
        ) : (
          <>
            {/* ================================================================
                ADMIN PORTAL VIEWS
            ================================================================ */}
            {currentUser.role === 'admin' && activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">Super Admin Control Dashboard</h1>
                  <p className="text-sm text-slate-500">Manage institutions, plan renewals, central syllabus & question bank, AI Chatbot rules, and all Firebase login accounts.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Registered Institutions</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">{institutions.length}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">100 Papers/Year Quota Each</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Total Faculty Logins</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">{faculties.length}</div>
                    <div className="text-xs text-indigo-600 font-medium mt-1">Across all institutions</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Central Question Bank</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">{questionsBank.length}</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">{curriculum.length} Classes Configured</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Pending Renewal Payments</div>
                    <div className="text-3xl font-extrabold text-amber-600 mt-1">
                      {renewalRequests.filter((r) => r.status === 'pending').length}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">Admin-only renewal approval</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('institutions')}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 text-left shadow-sm transition group"
                  >
                    <Building2 className="w-7 h-7 text-indigo-600 mb-2" />
                    <div className="font-bold text-slate-900 group-hover:text-indigo-700">Add Institution & Renew Plans</div>
                    <p className="text-xs text-slate-500 mt-1">Onboard institutions with 100 papers/yr and verify renewal payments.</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 text-left shadow-sm transition group"
                  >
                    <FolderTree className="w-7 h-7 text-emerald-600 mb-2" />
                    <div className="font-bold text-slate-900 group-hover:text-emerald-700">Class → Subject → Chapter → Topic</div>
                    <p className="text-xs text-slate-500 mt-1">Add syllabus contents and repository questions for faculty & institutions.</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('chatbot_control')}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 text-left shadow-sm transition group"
                  >
                    <Bot className="w-7 h-7 text-violet-600 mb-2" />
                    <div className="font-bold text-slate-900 group-hover:text-violet-700">Control AI Chatbot & Rules</div>
                    <p className="text-xs text-slate-500 mt-1">Enable/disable AI Chatbot, control image generation, limits, and campus permissions.</p>
                  </button>
                </div>
              </div>
            )}

            {/* ADMIN: INSTITUTIONS & PLAN RENEWALS */}
            {currentUser.role === 'admin' && activeTab === 'institutions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Institutions & Annual Plan Renewals</h2>
                  <p className="text-sm text-slate-500">Every institution receives 100 question papers per year. Only Admin can renew plans after payment verification.</p>
                </div>

                {/* Pending Payment Renewal Requests */}
                <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    Institution Renewal Payment Requests
                  </h3>
                  {renewalRequests.length === 0 ? (
                    <p className="text-xs text-slate-500">No renewal requests submitted yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {renewalRequests.map((req) => (
                        <div key={req.id} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-sm text-slate-900">{req.institutionName}</div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              Amount Paid: <strong>₹{req.amount}</strong> • Txn Ref: <code className="bg-white px-1.5 py-0.5 rounded border">{req.paymentRef}</code> • Date: {req.requestedAt}
                            </div>
                          </div>
                          {req.status === 'pending' ? (
                            <button
                              onClick={() => {
                                const updatedReq = { ...req, status: 'approved' };
                                setRenewalRequests((prev) => prev.map((r) => (r.id === req.id ? updatedReq : r)));
                                persistDoc('renewalRequests', req.id, updatedReq);
                                setInstitutions((prev) =>
                                  prev.map((inst) => {
                                    if (inst.id === req.institutionId) {
                                      const updatedInst = { ...inst, papersUsed: 0, annualQuota: 100, renewalPending: false, planExpiry: '2027-12-31' };
                                      persistDoc('institutions', updatedInst.id, updatedInst);
                                      return updatedInst;
                                    }
                                    return inst;
                                  })
                                );
                                notify(`Renewed & autosaved 100-paper annual quota for ${req.institutionName}!`, 'success');
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Verify Payment & Renew 100 Papers
                            </button>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              Renewed & Active
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Institution Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-base mb-3">Register New Institution (100 Papers/Year)</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newInst.name || !newInst.email || !newInst.password) return;
                      const created = {
                        id: `inst-${Date.now()}`,
                        name: newInst.name.trim(),
                        code: newInst.code.trim() || `INST-${Math.floor(1000 + Math.random() * 9000)}`,
                        email: newInst.email.trim(),
                        password: newInst.password,
                        status: 'active',
                        annualQuota: 100,
                        papersUsed: 0,
                        planExpiry: '2027-11-24',
                        renewalPending: false,
                        layout: { ...DEFAULT_LAYOUT },
                        markingModels: JSON.parse(JSON.stringify(DEFAULT_MARKING_MODELS))
                      };
                      setInstitutions((prev) => [created, ...prev]);
                      persistDoc('institutions', created.id, created);
                      setNewInst({ name: '', code: '', email: '', password: '' });
                      notify(`Institution "${created.name}" added & autosaved with 100 papers/year quota!`, 'success');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Institution Name *"
                      value={newInst.name}
                      onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Institution Code (e.g., SXC-01)"
                      value={newInst.code}
                      onChange={(e) => setNewInst({ ...newInst, code: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Institution Login Email *"
                      value={newInst.email}
                      onChange={(e) => setNewInst({ ...newInst, email: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Initial Password *"
                      value={newInst.password}
                      onChange={(e) => setNewInst({ ...newInst, password: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" /> Add Institution
                    </button>
                  </form>
                </div>

                {/* Institutions List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutions.map((inst) => {
                    const pct = Math.min(100, Math.round((inst.papersUsed / inst.annualQuota) * 100));
                    return (
                      <div key={inst.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{inst.code}</span>
                            <h4 className="font-bold text-slate-900 text-base mt-1">{inst.name}</h4>
                            <p className="text-xs text-slate-500">{inst.email}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${inst.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {inst.status.toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Annual Question Paper Quota</span>
                            <span>{inst.papersUsed} / {inst.annualQuota} Papers Used</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 95 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">Plan Valid Till: {inst.planExpiry}</div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setInstitutions((prev) =>
                                prev.map((item) => {
                                  if (item.id === inst.id) {
                                    const updatedInst = { ...item, papersUsed: 0, annualQuota: 100, renewalPending: false, planExpiry: '2027-12-31' };
                                    persistDoc('institutions', updatedInst.id, updatedInst);
                                    return updatedInst;
                                  }
                                  return item;
                                })
                              );
                              notify(`Admin renewed & autosaved 100-paper annual plan for ${inst.name}.`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Admin Renew Plan (Reset 100)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ADMIN: SYLLABUS & QUESTION BANK MANAGER */}
            {currentUser.role === 'admin' && activeTab === 'curriculum' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Class → Subject → Chapter → Topic & Question Bank</h2>
                  <p className="text-sm text-slate-500">Structure the syllabus hierarchy and add topic contents & questions used by Institutions, Faculty, and the AI Chatbot.</p>
                </div>

                {/* 4-Level Hierarchy Selector & Creators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Level 1: Class */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="text-xs font-extrabold uppercase text-indigo-600">1. Class</div>
                    <select
                      value={admClass?.id || ''}
                      onChange={(e) => {
                        const cls = curriculum.find((c) => c.id === e.target.value);
                        setAdmClassId(e.target.value);
                        setAdmSubjectId(cls?.subjects?.[0]?.id || '');
                        setAdmChapterId(cls?.subjects?.[0]?.chapters?.[0]?.id || '');
                        setAdmTopicId(cls?.subjects?.[0]?.chapters?.[0]?.topics?.[0]?.id || '');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                    >
                      {curriculum.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="New Class (e.g. Class 11)"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (!newClassName.trim()) return;
                          const id = `cls-${Date.now()}`;
                          const createdCls = { id, name: newClassName.trim(), subjects: [] };
                          setCurriculum((prev) => [...prev, createdCls]);
                          persistDoc('curriculum', createdCls.id, createdCls);
                          setAdmClassId(id);
                          setNewClassName('');
                          notify('Class added & autosaved!', 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Level 2: Subject */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="text-xs font-extrabold uppercase text-indigo-600">2. Subject</div>
                    <select
                      value={admSubject?.id || ''}
                      onChange={(e) => {
                        const sub = admClass?.subjects.find((s) => s.id === e.target.value);
                        setAdmSubjectId(e.target.value);
                        setAdmChapterId(sub?.chapters?.[0]?.id || '');
                        setAdmTopicId(sub?.chapters?.[0]?.topics?.[0]?.id || '');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                    >
                      {(admClass?.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="New Subject (e.g. Chemistry)"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (!newSubjectName.trim() || !admClass) return;
                          const id = `sub-${Date.now()}`;
                          setCurriculum((prev) =>
                            prev.map((c) => {
                              if (c.id === admClass.id) {
                                const updatedCls = { ...c, subjects: [...c.subjects, { id, name: newSubjectName.trim(), chapters: [] }] };
                                persistDoc('curriculum', updatedCls.id, updatedCls);
                                return updatedCls;
                              }
                              return c;
                            })
                          );
                          setAdmSubjectId(id);
                          setNewSubjectName('');
                          notify('Subject added & autosaved!', 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Level 3: Chapter */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="text-xs font-extrabold uppercase text-indigo-600">3. Chapter</div>
                    <select
                      value={admChapter?.id || ''}
                      onChange={(e) => {
                        const ch = admSubject?.chapters.find((c) => c.id === e.target.value);
                        setAdmChapterId(e.target.value);
                        setAdmTopicId(ch?.topics?.[0]?.id || '');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                    >
                      {(admSubject?.chapters || []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="New Chapter Name"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (!newChapterName.trim() || !admSubject) return;
                          const id = `ch-${Date.now()}`;
                          setCurriculum((prev) =>
                            prev.map((c) => {
                              if (c.id === admClass.id) {
                                const updatedCls = {
                                  ...c,
                                  subjects: c.subjects.map((s) =>
                                    s.id === admSubject.id
                                      ? { ...s, chapters: [...s.chapters, { id, name: newChapterName.trim(), topics: [] }] }
                                      : s
                                  )
                                };
                                persistDoc('curriculum', updatedCls.id, updatedCls);
                                return updatedCls;
                              }
                              return c;
                            })
                          );
                          setAdmChapterId(id);
                          setNewChapterName('');
                          notify('Chapter added & autosaved!', 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Level 4: Topic */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="text-xs font-extrabold uppercase text-indigo-600">4. Topic</div>
                    <select
                      value={admTopic?.id || ''}
                      onChange={(e) => setAdmTopicId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                    >
                      {(admChapter?.topics || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="New Topic Title"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                {/* Add Topic Content & Add Question to Selected Topic */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm">Add / Save Topic Syllabus Content</h3>
                    <p className="text-xs text-slate-500">
                      Target: <strong>{admClass?.name}</strong> → <strong>{admSubject?.name}</strong> → <strong>{admChapter?.name}</strong>
                    </p>
                    <textarea
                      rows={4}
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      placeholder="Enter syllabus concepts, formulas, definitions, and study content for this topic..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!admChapter) return;
                        if (newTopicName.trim()) {
                          const tid = `tp-${Date.now()}`;
                          setCurriculum((prev) =>
                            prev.map((c) => {
                              if (c.id === admClass.id) {
                                const updatedCls = {
                                  ...c,
                                  subjects: c.subjects.map((s) =>
                                    s.id === admSubject.id
                                      ? {
                                          ...s,
                                          chapters: s.chapters.map((ch) =>
                                            ch.id === admChapter.id
                                              ? { ...ch, topics: [...ch.topics, { id: tid, name: newTopicName.trim(), content: newTopicContent.trim() }] }
                                              : ch
                                          )
                                        }
                                      : s
                                  )
                                };
                                persistDoc('curriculum', updatedCls.id, updatedCls);
                                return updatedCls;
                              }
                              return c;
                            })
                          );
                          setAdmTopicId(tid);
                          setNewTopicName('');
                          setNewTopicContent('');
                          notify('New topic & syllabus content autosaved!', 'success');
                        } else if (admTopic && newTopicContent.trim()) {
                          setCurriculum((prev) =>
                            prev.map((c) => {
                              if (c.id === admClass.id) {
                                const updatedCls = {
                                  ...c,
                                  subjects: c.subjects.map((s) =>
                                    s.id === admSubject.id
                                      ? {
                                          ...s,
                                          chapters: s.chapters.map((ch) =>
                                            ch.id === admChapter.id
                                              ? {
                                                  ...ch,
                                                  topics: ch.topics.map((t) =>
                                                    t.id === admTopic.id ? { ...t, content: newTopicContent.trim() } : t
                                                  )
                                                }
                                              : ch
                                          )
                                        }
                                      : s
                                  )
                                };
                                persistDoc('curriculum', updatedCls.id, updatedCls);
                                return updatedCls;
                              }
                              return c;
                            })
                          );
                          setNewTopicContent('');
                          notify('Updated & autosaved topic content!', 'success');
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      Save Topic & Syllabus Content
                    </button>

                    {admTopic && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="font-bold text-slate-800">Active Topic: {admTopic.name}</div>
                        <p className="text-slate-600 mt-1">{admTopic.content || 'No content added yet.'}</p>
                      </div>
                    )}
                  </div>

                  {/* Add Question to Bank */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm">Add Question to Central Repository</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      <select
                        value={newBankQ.type}
                        onChange={(e) => setNewBankQ({ ...newBankQ, type: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="Short Answer">Short Answer</option>
                        <option value="Long Answer">Long Answer</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={newBankQ.marks}
                        onChange={(e) => setNewBankQ({ ...newBankQ, marks: Number(e.target.value) })}
                        placeholder="Marks"
                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                      <select
                        value={newBankQ.difficulty}
                        onChange={(e) => setNewBankQ({ ...newBankQ, difficulty: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <textarea
                      rows={3}
                      value={newBankQ.text}
                      onChange={(e) => setNewBankQ({ ...newBankQ, text: e.target.value })}
                      placeholder="Enter question text (supports any language)..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs"
                    />

                    {/* Optional Image for Question Bank Entry (Stored in Firebase Storage) */}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer hover:bg-indigo-100 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> {newBankQ.imageData ? 'Change Image' : 'Attach Question Image (Firebase Storage)'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const uploadedUrl = await uploadAssetToCloud(file, 'question-images', file.name);
                            setNewBankQ({ ...newBankQ, imageData: uploadedUrl });
                            notify('Question image uploaded to Firebase Storage!', 'success');
                          }}
                        />
                      </label>
                      {newBankQ.imageData && (
                        <div className="flex items-center gap-2">
                          <img src={newBankQ.imageData} alt="Preview" className="h-10 rounded border" />
                          <button type="button" onClick={() => setNewBankQ({ ...newBankQ, imageData: '' })} className="text-xs text-rose-600 font-semibold">Remove</button>
                        </div>
                      )}
                    </div>

                    {newBankQ.type === 'MCQ' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Option A" value={newBankQ.optA} onChange={(e) => setNewBankQ({ ...newBankQ, optA: e.target.value })} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs" />
                        <input type="text" placeholder="Option B" value={newBankQ.optB} onChange={(e) => setNewBankQ({ ...newBankQ, optB: e.target.value })} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs" />
                        <input type="text" placeholder="Option C" value={newBankQ.optC} onChange={(e) => setNewBankQ({ ...newBankQ, optC: e.target.value })} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs" />
                        <input type="text" placeholder="Option D" value={newBankQ.optD} onChange={(e) => setNewBankQ({ ...newBankQ, optD: e.target.value })} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs" />
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Answer Key / Marking Scheme Hint"
                      value={newBankQ.answerKey}
                      onChange={(e) => setNewBankQ({ ...newBankQ, answerKey: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />

                    <button
                      onClick={() => {
                        if (!newBankQ.text.trim() || !admTopic) {
                          notify('Please select a valid Topic and enter question text.', 'error');
                          return;
                        }
                        const createdQ = {
                          id: `q-${Date.now()}`,
                          classId: admClass.id,
                          subjectId: admSubject.id,
                          chapterId: admChapter.id,
                          topicId: admTopic.id,
                          type: newBankQ.type,
                          marks: Number(newBankQ.marks) || 1,
                          difficulty: newBankQ.difficulty,
                          text: newBankQ.text.trim(),
                          imageData: newBankQ.imageData,
                          options: newBankQ.type === 'MCQ' ? [newBankQ.optA, newBankQ.optB, newBankQ.optC, newBankQ.optD].filter(Boolean) : [],
                          answerKey: newBankQ.answerKey.trim()
                        };
                        setQuestionsBank((prev) => [createdQ, ...prev]);
                        persistDoc('questionsBank', createdQ.id, createdQ);
                        setNewBankQ({ type: 'Short Answer', marks: 2, difficulty: 'Medium', text: '', optA: '', optB: '', optC: '', optD: '', answerKey: '', imageData: '' });
                        notify('Question added & autosaved to Central Question Bank!', 'success');
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Question to Topic "{admTopic?.name || ''}"
                    </button>
                  </div>
                </div>

                {/* Questions List for Current Topic */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm mb-3">
                    Questions in "{admTopic?.name || 'Selected Topic'}" ({questionsBank.filter((q) => q.topicId === admTopic?.id).length})
                  </h3>
                  <div className="space-y-2.5">
                    {questionsBank.filter((q) => q.topicId === admTopic?.id).map((q) => (
                      <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">{q.marks}m</span>
                            <span className="text-[11px] font-medium text-slate-500">{q.type} • {q.difficulty}</span>
                          </div>
                          <p className="text-sm text-slate-900">{q.text}</p>
                        </div>
                        <button
                          onClick={() => {
                            setQuestionsBank((prev) => prev.filter((item) => item.id !== q.id));
                            removeDocFromCloud('questionsBank', q.id);
                            notify('Question deleted from bank.', 'info');
                          }}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN: AI CHATBOT CONTROL PANEL */}
            {currentUser.role === 'admin' && activeTab === 'chatbot_control' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">AI Chatbot Governance & Control</h2>
                    <p className="text-sm text-slate-500">Admin controls global AI Chatbot availability, role & campus permissions, AI diagram generation, syllabus strictness, and custom exam instructions.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-700">Master AI Chatbot:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setChatbotConfig((prev) => {
                          const nextCfg = { ...prev, enabled: !prev.enabled };
                          persistGlobalConfig(nextCfg);
                          return nextCfg;
                        });
                        notify(!chatbotConfig.enabled ? 'AI Chatbot Enabled Globally' : 'AI Chatbot Disabled Globally', 'info');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                        chatbotConfig.enabled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {chatbotConfig.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                {/* Usage Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Total AI Prompts Executed</div>
                    <div className="text-3xl font-extrabold text-indigo-700 mt-1">{chatbotConfig.totalPromptsRun}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">AI Questions Generated</div>
                    <div className="text-3xl font-extrabold text-violet-700 mt-1">{chatbotConfig.totalQuestionsGenerated}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">AI Diagram / Image Mode</div>
                      <div className="text-lg font-extrabold text-slate-900 mt-1">
                        {chatbotConfig.allowAiImageGeneration ? 'Allowed' : 'Blocked'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatbotConfig((prev) => ({ ...prev, allowAiImageGeneration: !prev.allowAiImageGeneration }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        chatbotConfig.allowAiImageGeneration ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Toggle
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Policy & Limits */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" /> Chatbot Rules, Limits & System Prompt
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                        <span className="text-xs font-bold text-slate-800">Allow Faculty Login Access</span>
                        <input
                          type="checkbox"
                          checked={chatbotConfig.allowFaculty}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, allowFaculty: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                        <span className="text-xs font-bold text-slate-800">Allow Institution Login Access</span>
                        <input
                          type="checkbox"
                          checked={chatbotConfig.allowInstitution}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, allowInstitution: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                        <span className="text-xs font-bold text-slate-800">Strict Syllabus-Only Mode</span>
                        <input
                          type="checkbox"
                          checked={chatbotConfig.strictSyllabusOnly}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, strictSyllabusOnly: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                        <span className="text-xs font-bold text-slate-800">Allow AI Image / Diagram Gen</span>
                        <input
                          type="checkbox"
                          checked={chatbotConfig.allowAiImageGeneration}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, allowAiImageGeneration: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Max Questions per AI Prompt</label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={chatbotConfig.maxQuestionsPerPrompt}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, maxQuestionsPerPrompt: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks per AI Question</label>
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={chatbotConfig.maxMarksPerQuestion}
                          onChange={(e) => setChatbotConfig({ ...chatbotConfig, maxMarksPerQuestion: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Allowed Difficulty Levels</label>
                      <div className="flex flex-wrap gap-2">
                        {['Easy', 'Medium', 'Hard'].map((diff) => {
                          const active = (chatbotConfig.allowedDifficulties || []).includes(diff);
                          return (
                            <button
                              key={diff}
                              type="button"
                              onClick={() => {
                                const current = chatbotConfig.allowedDifficulties || [];
                                const next = active ? current.filter((d) => d !== diff) : [...current, diff];
                                if (next.length > 0) setChatbotConfig({ ...chatbotConfig, allowedDifficulties: next });
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                                active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'
                              }`}
                            >
                              {diff}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Admin System Prompt / Examination Guidelines</label>
                      <textarea
                        rows={3}
                        value={chatbotConfig.customAdminGuidelines}
                        onChange={(e) => setChatbotConfig({ ...chatbotConfig, customAdminGuidelines: e.target.value })}
                        placeholder="Enter mandatory instructions for the AI Chatbot..."
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        persistGlobalConfig(chatbotConfig);
                        notify('AI Chatbot settings & rules autosaved and applied immediately!', 'success');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      Save AI Chatbot Policies
                    </button>
                  </div>

                  {/* Right: Per-Institution Chatbot Access Control */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" /> Per-Institution Chatbot Access
                    </h3>
                    <p className="text-xs text-slate-500">Enable or restrict AI Chatbot usage for individual institutions.</p>
                    <div className="space-y-2.5">
                      {institutions.map((inst) => {
                        const isBlocked = (chatbotConfig.disabledInstitutionIds || []).includes(inst.id);
                        return (
                          <div key={inst.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-sm text-slate-900">{inst.name}</div>
                              <div className="text-[11px] text-slate-500">{inst.code} • {inst.email}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const list = chatbotConfig.disabledInstitutionIds || [];
                                const next = isBlocked ? list.filter((id) => id !== inst.id) : [...list, inst.id];
                                const nextCfg = { ...chatbotConfig, disabledInstitutionIds: next };
                                setChatbotConfig(nextCfg);
                                persistGlobalConfig(nextCfg);
                                notify(`AI Chatbot ${isBlocked ? 'enabled' : 'disabled'} for ${inst.name}`, 'info');
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                                !isBlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {!isBlocked ? 'Allowed' : 'Restricted'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN: ALL LOGINS CONTROL CENTER */}
            {currentUser.role === 'admin' && activeTab === 'logins' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Master Login Control Center</h2>
                  <p className="text-sm text-slate-500">Admin controls every Institution and Faculty login across Firebase Auth & Firestore: suspend, activate, or reset passwords.</p>
                </div>

                {/* Institution Logins Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-base">Institution Logins ({institutions.length})</h3>
                  <div className="space-y-2.5">
                    {institutions.map((inst) => (
                      <div key={inst.id} className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{inst.name}</div>
                          <div className="text-xs text-slate-500">Email: {inst.email} • Password: <code>{inst.password}</code></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${inst.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {inst.status}
                          </span>
                          <button
                            onClick={() => { setPasswordModalUser({ type: 'institution', id: inst.id, name: inst.name }); setNewPasswordInput(inst.password); }}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Reset Password
                          </button>
                          <button
                            onClick={() => {
                              setInstitutions((prev) =>
                                prev.map((item) => {
                                  if (item.id === inst.id) {
                                    const updatedInst = { ...item, status: item.status === 'active' ? 'suspended' : 'active' };
                                    persistDoc('institutions', updatedInst.id, updatedInst);
                                    return updatedInst;
                                  }
                                  return item;
                                })
                              );
                              notify(`Updated & autosaved login status for ${inst.name}`, 'info');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                              inst.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {inst.status === 'active' ? <><Lock className="w-3.5 h-3.5" /> Suspend</> : <><Unlock className="w-3.5 h-3.5" /> Activate</>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faculty Logins Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-base">Faculty Logins ({faculties.length})</h3>
                  <div className="space-y-2.5">
                    {faculties.map((fac) => {
                      const parentInst = institutions.find((i) => i.id === fac.institutionId);
                      return (
                        <div key={fac.id} className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-sm text-slate-900">{fac.name} <span className="text-xs font-normal text-slate-500">({fac.department})</span></div>
                            <div className="text-xs text-slate-500">
                              Institution: <strong>{parentInst?.name}</strong> • Email: {fac.email} • Password: <code>{fac.password}</code>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${fac.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {fac.status}
                            </span>
                            <button
                              onClick={() => { setPasswordModalUser({ type: 'faculty', id: fac.id, name: fac.name }); setNewPasswordInput(fac.password); }}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Reset Password
                            </button>
                            <button
                              onClick={() => {
                                setFaculties((prev) =>
                                  prev.map((item) => {
                                    if (item.id === fac.id) {
                                      const updatedFac = { ...item, status: item.status === 'active' ? 'suspended' : 'active' };
                                      persistDoc('faculties', updatedFac.id, updatedFac);
                                      return updatedFac;
                                    }
                                    return item;
                                  })
                                );
                                notify(`Updated & autosaved login status for ${fac.name}`, 'info');
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                                fac.status === 'active'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {fac.status === 'active' ? <><Lock className="w-3.5 h-3.5" /> Suspend</> : <><Unlock className="w-3.5 h-3.5" /> Activate</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                INSTITUTION PORTAL VIEWS
            ================================================================ */}
            {currentUser.role === 'institution' && activeInstitution && activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">{activeInstitution.name}</h1>
                    <p className="text-sm text-slate-500">Design question paper layouts, configure marking models, verify faculty papers, and manage faculty logins.</p>
                  </div>
                  <button
                    onClick={() => { setEditingPaper(null); setBuilderOpen(true); }}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center gap-2 self-start"
                  >
                    <Plus className="w-4 h-4" /> Create Question Paper
                  </button>
                </div>

                {/* Quota Warning Banner */}
                {activeInstitution.papersUsed >= activeInstitution.annualQuota - 2 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-amber-950">
                        <strong>Annual Quota Alert ({activeInstitution.papersUsed}/{activeInstitution.annualQuota} Used):</strong> Your institution has almost reached the 100 question papers/year limit. Submit renewal payment to continue uninterrupted.
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('quota')}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
                    >
                      Pay & Request Renewal
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Annual Quota Remaining</div>
                    <div className="text-3xl font-extrabold text-indigo-700 mt-1">
                      {Math.max(0, activeInstitution.annualQuota - activeInstitution.papersUsed)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{activeInstitution.papersUsed} of {activeInstitution.annualQuota} used</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Institution Papers</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {papers.filter((p) => p.institutionId === activeInstitution.id).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Word & PDF export ready</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Awaiting Verification</div>
                    <div className="text-3xl font-extrabold text-amber-600 mt-1">
                      {papers.filter((p) => p.institutionId === activeInstitution.id && p.status === 'pending_verification').length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Submitted by Faculty</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Active Faculty Logins</div>
                    <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                      {faculties.filter((f) => f.institutionId === activeInstitution.id && f.status === 'active').length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Managed by Institution & Admin</div>
                  </div>
                </div>
              </div>
            )}

            {/* INSTITUTION: LAYOUT DESIGNER & MARKING MODEL BUILDER */}
            {currentUser.role === 'institution' && activeInstitution && activeTab === 'layout' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Question Paper Layout Designer & Marking Models</h2>
                  <p className="text-sm text-slate-500">Customize institution logo (Firebase Storage), logo watermark, multilingual fonts, typography, and exam marking blueprints.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Layout Controls */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 max-h-[820px] overflow-y-auto">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Layout className="w-4 h-4 text-indigo-600" /> Paper Header, Logo & Watermark
                    </h3>

                    {/* Institution Logo Upload & Logo Watermark */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-indigo-600" /> Institution Logo (Firebase Storage)
                        </span>
                        {activeInstitution.layout.logoDataUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, logoDataUrl: '', watermarkMode: 'text' } }
                                    : inst
                                )
                              );
                            }}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" /> {activeInstitution.layout.logoDataUrl ? 'Change Logo' : 'Add Logo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const uploadedUrl = await uploadAssetToCloud(file, 'logos', file.name);
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, logoDataUrl: uploadedUrl } }
                                    : inst
                                )
                              );
                              notify('Institution logo uploaded to Firebase Storage!', 'success');
                            }}
                          />
                        </label>

                        {activeInstitution.layout.logoDataUrl && (
                          <img
                            src={activeInstitution.layout.logoDataUrl}
                            alt="Logo"
                            className="h-12 w-12 object-contain rounded-lg border border-slate-300 bg-white p-1"
                          />
                        )}
                      </div>

                      {activeInstitution.layout.logoDataUrl && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Header Logo Height: {activeInstitution.layout.logoHeight || 56}px
                          </label>
                          <input
                            type="range"
                            min="32"
                            max="96"
                            value={activeInstitution.layout.logoHeight || 56}
                            onChange={(e) =>
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, logoHeight: Number(e.target.value) } }
                                    : inst
                                )
                              )
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Watermark Mode</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'none', label: 'None' },
                            { id: 'text', label: 'Text Watermark' },
                            { id: 'logo', label: 'Logo Watermark' }
                          ].map((wm) => (
                            <button
                              key={wm.id}
                              type="button"
                              onClick={() => {
                                if (wm.id === 'logo' && !activeInstitution.layout.logoDataUrl) {
                                  notify('Please upload an Institution Logo first using "Add Logo".', 'error');
                                  return;
                                }
                                setInstitutions((prev) =>
                                  prev.map((inst) =>
                                    inst.id === activeInstitution.id
                                      ? { ...inst, layout: { ...inst.layout, watermarkMode: wm.id } }
                                      : inst
                                  )
                                );
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border ${
                                (activeInstitution.layout.watermarkMode || 'text') === wm.id
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 border-slate-300'
                              }`}
                            >
                              {wm.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(activeInstitution.layout.watermarkMode || 'text') === 'text' && (
                        <input
                          type="text"
                          value={activeInstitution.layout.watermarkText}
                          onChange={(e) =>
                            setInstitutions((prev) =>
                              prev.map((inst) =>
                                inst.id === activeInstitution.id
                                  ? { ...inst, layout: { ...inst.layout, watermarkText: e.target.value } }
                                  : inst
                              )
                            )
                          }
                          placeholder="Watermark text (e.g., CONFIDENTIAL)"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      )}

                      {(activeInstitution.layout.watermarkMode || 'text') !== 'none' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Watermark Opacity: {Math.round((activeInstitution.layout.watermarkOpacity ?? 0.08) * 100)}%
                          </label>
                          <input
                            type="range"
                            min="0.03"
                            max="0.30"
                            step="0.01"
                            value={activeInstitution.layout.watermarkOpacity ?? 0.08}
                            onChange={(e) =>
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, watermarkOpacity: Number(e.target.value) } }
                                    : inst
                                )
                              )
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      )}
                    </div>

                    {/* Typography, Font Family, Font Size & Bold/Italic/Underline */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Type className="w-4 h-4 text-indigo-600" /> Typography, Language & Custom Fonts
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Default Question Paper Language</label>
                        <select
                          value={activeInstitution.layout.paperLanguage || 'English'}
                          onChange={(e) => {
                            const langObj = SUPPORTED_LANGUAGES.find((l) => l.name === e.target.value);
                            setInstitutions((prev) =>
                              prev.map((inst) =>
                                inst.id === activeInstitution.id
                                  ? {
                                      ...inst,
                                      layout: {
                                        ...inst.layout,
                                        paperLanguage: e.target.value,
                                        textDirection: langObj?.dir || 'ltr',
                                        fontFamily: langObj?.recommendedFont || inst.layout.fontFamily
                                      }
                                    }
                                  : inst
                              )
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        >
                          {SUPPORTED_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.name}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Question Paper Font Family</label>
                        <select
                          value={activeInstitution.layout.fontFamily}
                          onChange={(e) =>
                            setInstitutions((prev) =>
                              prev.map((inst) =>
                                inst.id === activeInstitution.id
                                  ? { ...inst, layout: { ...inst.layout, fontFamily: e.target.value } }
                                  : inst
                              )
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        >
                          {[...BUILTIN_FONTS, ...customFonts].map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Upload Any Custom Font File (.ttf/.otf/.woff) to Firebase Storage or Add Google Font */}
                      <div className="p-2.5 rounded-lg bg-white border border-indigo-200 space-y-2">
                        <div className="text-[11px] font-bold text-indigo-900">Add Any Font of Any Language (Firebase Storage)</div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newCustomFontName}
                            onChange={(e) => setNewCustomFontName(e.target.value)}
                            placeholder="Font Name (e.g., Rachana Malayalam)"
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <label className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 shrink-0">
                            <Upload className="w-3 h-3" /> Upload Font
                            <input
                              type="file"
                              accept=".ttf,.otf,.woff,.woff2"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const fontLabel = newCustomFontName.trim() || file.name.replace(/\.[^/.]+$/, '');
                                const fontUrl = await uploadAssetToCloud(file, 'custom-fonts', file.name);
                                const newFont = {
                                  id: `custom-font-${Date.now()}`,
                                  name: fontLabel,
                                  label: `${fontLabel} (Custom Uploaded)`,
                                  cssFamily: `"${fontLabel}", sans-serif`,
                                  dataUrl: fontUrl
                                };
                                setCustomFonts((prev) => [...prev, newFont]);
                                persistDoc('customFonts', newFont.id, newFont);
                                setInstitutions((prev) =>
                                  prev.map((inst) => {
                                    if (inst.id === activeInstitution.id) {
                                      const updatedInst = { ...inst, layout: { ...inst.layout, fontFamily: newFont.id } };
                                      persistDoc('institutions', updatedInst.id, updatedInst);
                                      return updatedInst;
                                    }
                                    return inst;
                                  })
                                );
                                setNewCustomFontName('');
                                notify(`Custom font "${fontLabel}" uploaded to Firebase Storage & autosaved!`, 'success');
                              }}
                            />
                          </label>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newGoogleFontName}
                            onChange={(e) => setNewGoogleFontName(e.target.value)}
                            placeholder="Or Google Font name (e.g., Chilanka, Cairo, Poppins)"
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const gName = newGoogleFontName.trim();
                              if (!gName) return;
                              const newFont = {
                                id: `gfont-${Date.now()}`,
                                name: gName,
                                label: `${gName} (Google Font)`,
                                cssFamily: `"${gName}", sans-serif`,
                                googleFamily: `${gName.replace(/\s+/g, '+')}:wght@400;600;700`
                              };
                              setCustomFonts((prev) => [...prev, newFont]);
                              persistDoc('customFonts', newFont.id, newFont);
                              setInstitutions((prev) =>
                                prev.map((inst) => {
                                  if (inst.id === activeInstitution.id) {
                                    const updatedInst = { ...inst, layout: { ...inst.layout, fontFamily: newFont.id } };
                                    persistDoc('institutions', updatedInst.id, updatedInst);
                                    return updatedInst;
                                  }
                                  return inst;
                                })
                              );
                              setNewGoogleFontName('');
                              notify(`Google Font "${gName}" imported & autosaved!`, 'success');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0"
                          >
                            + Add Font
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Default Font Size: {activeInstitution.layout.fontSize || 14}px
                        </label>
                        <input
                          type="range"
                          min="11"
                          max="22"
                          value={activeInstitution.layout.fontSize || 14}
                          onChange={(e) =>
                            setInstitutions((prev) =>
                              prev.map((inst) =>
                                inst.id === activeInstitution.id
                                  ? { ...inst, layout: { ...inst.layout, fontSize: Number(e.target.value) } }
                                  : inst
                              )
                            )
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-600">Default Question Style:</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, isBold: !inst.layout.isBold } }
                                    : inst
                                )
                              )
                            }
                            className={`p-2 rounded-lg border text-xs ${activeInstitution.layout.isBold ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                            title="Bold"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, isItalic: !inst.layout.isItalic } }
                                    : inst
                                )
                              )
                            }
                            className={`p-2 rounded-lg border text-xs ${activeInstitution.layout.isItalic ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                            title="Italic"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, isUnderline: !inst.layout.isUnderline } }
                                    : inst
                                )
                              )
                            }
                            className={`p-2 rounded-lg border text-xs ${activeInstitution.layout.isUnderline ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}`}
                            title="Underline"
                          >
                            <Underline className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Header Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['classic', 'modern-banner', 'minimal'].map((st) => (
                          <button
                            key={st}
                            onClick={() =>
                              setInstitutions((prev) =>
                                prev.map((inst) =>
                                  inst.id === activeInstitution.id
                                    ? { ...inst, layout: { ...inst.layout, headerStyle: st } }
                                    : inst
                                )
                              )
                            }
                            className={`py-2 px-2 rounded-xl text-xs font-semibold border capitalize ${
                              activeInstitution.layout.headerStyle === st
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {st.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Accent Color</label>
                        <input
                          type="color"
                          value={activeInstitution.layout.accentColor}
                          onChange={(e) =>
                            setInstitutions((prev) =>
                              prev.map((inst) =>
                                inst.id === activeInstitution.id
                                  ? { ...inst, layout: { ...inst.layout, accentColor: e.target.value } }
                                  : inst
                              )
                            )
                          }
                          className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Page Border</label>
                        <select
                          value={activeInstitution.layout.borderStyle}
                          onChange={(e) =>
                            setInstitutions((prev) =>
                              prev.map((inst) =>
                                inst.id === activeInstitution.id
                                  ? { ...inst, layout: { ...inst.layout, borderStyle: e.target.value } }
                                  : inst
                              )
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        >
                          <option value="double">Double Border</option>
                          <option value="solid">Single Solid</option>
                          <option value="none">Borderless</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Institution Motto / Tagline</label>
                      <input
                        type="text"
                        value={activeInstitution.layout.institutionMotto}
                        onChange={(e) =>
                          setInstitutions((prev) =>
                            prev.map((inst) =>
                              inst.id === activeInstitution.id
                                ? { ...inst, layout: { ...inst.layout, institutionMotto: e.target.value } }
                                : inst
                            )
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Default General Instructions</label>
                      <textarea
                        rows={3}
                        value={activeInstitution.layout.instructions}
                        onChange={(e) =>
                          setInstitutions((prev) =>
                            prev.map((inst) =>
                              inst.id === activeInstitution.id
                                ? { ...inst, layout: { ...inst.layout, instructions: e.target.value } }
                                : inst
                            )
                          )
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={activeInstitution.layout.showStudentBox}
                        onChange={(e) =>
                          setInstitutions((prev) =>
                            prev.map((inst) =>
                              inst.id === activeInstitution.id
                                ? { ...inst, layout: { ...inst.layout, showStudentBox: e.target.checked } }
                                : inst
                            )
                          )
                        }
                      />
                      Show Student Name & Roll Number Box
                    </label>

                    <button
                      onClick={() => {
                        persistDoc('institutions', activeInstitution.id, activeInstitution);
                        notify('Institution question paper layout autosaved to Firestore!', 'success');
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      Save Paper Layout
                    </button>
                  </div>

                  {/* Live Layout Preview */}
                  <div className="lg:col-span-7 bg-slate-200/70 p-4 sm:p-6 rounded-2xl">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-3 text-center">Live Layout Preview</div>
                    <PaperPreviewCanvas
                      paper={{
                        title: 'Sample Examination Paper Preview',
                        examDate: '2026-12-10',
                        duration: '2 Hours',
                        language: activeInstitution.layout.paperLanguage || 'English',
                        questions: INITIAL_QUESTIONS_BANK.slice(0, 3).map((q, idx) => ({
                          ...q,
                          sectionTitle: idx < 2 ? 'Section A - Objective' : 'Section B - Descriptive'
                        }))
                      }}
                      institution={activeInstitution}
                      className="Class 10"
                      subjectName="Physics"
                      customFonts={customFonts}
                    />
                  </div>
                </div>

                {/* Marking Model Blueprint Builder */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" /> Question Paper Marking Models
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeInstitution.markingModels.map((model) => {
                      const total = model.sections.reduce((acc, s) => acc + s.count * s.marksPerQ, 0);
                      return (
                        <div key={model.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-sm text-slate-900">{model.name}</div>
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold">{total} Marks</span>
                          </div>
                          <div className="text-xs text-slate-500">Duration: {model.duration}</div>
                          <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
                            {model.sections.map((s) => (
                              <div key={s.id} className="flex justify-between text-slate-700">
                                <span>{s.title}</span>
                                <strong>{s.count} × {s.marksPerQ}m</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Create New Marking Model */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="text-xs font-bold uppercase text-slate-500">Add Custom Marking Model</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Model Name (e.g., Term Exam 40 Marks)"
                        value={newModelForm.name}
                        onChange={(e) => setNewModelForm({ ...newModelForm, name: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., 1 Hour 30 Mins)"
                        value={newModelForm.duration}
                        onChange={(e) => setNewModelForm({ ...newModelForm, duration: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (!newModelForm.name.trim()) return;
                          const createdModel = {
                            id: `mm-${Date.now()}`,
                            name: newModelForm.name.trim(),
                            duration: newModelForm.duration || '1 Hour',
                            sections: newModelForm.sections
                          };
                          setInstitutions((prev) =>
                            prev.map((inst) => {
                              if (inst.id === activeInstitution.id) {
                                const updatedInst = { ...inst, markingModels: [...inst.markingModels, createdModel] };
                                persistDoc('institutions', updatedInst.id, updatedInst);
                                return updatedInst;
                              }
                              return inst;
                            })
                          );
                          setNewModelForm({ ...newModelForm, name: '' });
                          notify('New Marking Model created & autosaved!', 'success');
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        + Save Marking Model
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INSTITUTION: MANAGE FACULTY LOGINS */}
            {currentUser.role === 'institution' && activeInstitution && activeTab === 'faculties' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Faculty Logins Management</h2>
                  <p className="text-sm text-slate-500">Create and manage Faculty accounts for {activeInstitution.name}.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm mb-3">Add New Faculty Login</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newFaculty.name || !newFaculty.email || !newFaculty.password) return;
                      const created = {
                        id: `fac-${Date.now()}`,
                        institutionId: activeInstitution.id,
                        name: newFaculty.name.trim(),
                        email: newFaculty.email.trim(),
                        password: newFaculty.password,
                        department: newFaculty.department.trim() || 'General',
                        status: 'active'
                      };
                      setFaculties((prev) => [created, ...prev]);
                      persistDoc('faculties', created.id, created);
                      setNewFaculty({ name: '', email: '', password: '', department: '' });
                      notify(`Faculty account created & autosaved for ${created.name}!`, 'success');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Faculty Name *"
                      value={newFaculty.name}
                      onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Department (e.g., Physics)"
                      value={newFaculty.department}
                      onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Faculty Email *"
                      value={newFaculty.email}
                      onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Password *"
                      value={newFaculty.password}
                      onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                      + Add Faculty Login
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {faculties.filter((f) => f.institutionId === activeInstitution.id).map((fac) => (
                    <div key={fac.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{fac.name}</div>
                        <div className="text-xs text-slate-500">{fac.department} • {fac.email}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Password: <code>{fac.password}</code></div>
                      </div>
                      <button
                        onClick={() => {
                          setFaculties((prev) =>
                            prev.map((item) => {
                              if (item.id === fac.id) {
                                const updatedFac = { ...item, status: item.status === 'active' ? 'suspended' : 'active' };
                                persistDoc('faculties', updatedFac.id, updatedFac);
                                return updatedFac;
                              }
                              return item;
                            })
                          );
                          notify(`Updated & autosaved status for ${fac.name}`, 'info');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          fac.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {fac.status === 'active' ? 'Active' : 'Suspended'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INSTITUTION: VERIFY FACULTY QUESTION PAPERS */}
            {currentUser.role === 'institution' && activeInstitution && activeTab === 'verify' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Verify Faculty Question Papers</h2>
                  <p className="text-sm text-slate-500">Review questions created by Faculty (from Question Bank or AI Chatbot), inspect marks, and approve or request revisions.</p>
                </div>

                <div className="space-y-4">
                  {papers.filter((p) => p.institutionId === activeInstitution.id).map((paper) => {
                    const cls = curriculum.find((c) => c.id === paper.classId);
                    const sub = cls?.subjects.find((s) => s.id === paper.subjectId);
                    const totalM = paper.questions.reduce((acc, q) => acc + Number(q.marks || 0), 0);
                    const aiCount = paper.questions.filter((q) => q.source === 'AI Chatbot').length;
                    const bankCount = paper.questions.length - aiCount;

                    return (
                      <div key={paper.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                paper.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : paper.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {paper.status === 'verified' ? 'Verified & Approved' : paper.status === 'rejected' ? 'Revision Requested' : 'Pending Verification'}
                              </span>
                              <span className="text-xs text-slate-500">Created by: <strong>{paper.createdByName}</strong> ({paper.createdByRole})</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mt-1">{paper.title}</h3>
                            <p className="text-xs text-slate-500">
                              {cls?.name} • {sub?.name} • {paper.questions.length} Questions ({bankCount} Bank, {aiCount} AI) • <strong>{totalM} Marks</strong>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setPreviewModalPaper(paper)}
                              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect Paper
                            </button>
                            <button
                              onClick={() => {
                                setPapers((prev) =>
                                  prev.map((item) => {
                                    if (item.id === paper.id) {
                                      const updatedPaper = { ...item, status: 'verified', reviewNote: 'Verified and approved by Institution.' };
                                      persistDoc('papers', updatedPaper.id, updatedPaper);
                                      return updatedPaper;
                                    }
                                    return item;
                                  })
                                );
                                notify(`Verified & autosaved "${paper.title}"!`, 'success');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Approve
                            </button>
                            <button
                              onClick={() => {
                                setPapers((prev) =>
                                  prev.map((item) => {
                                    if (item.id === paper.id) {
                                      const updatedPaper = { ...item, status: 'rejected', reviewNote: 'Please review question distribution and resubmit.' };
                                      persistDoc('papers', updatedPaper.id, updatedPaper);
                                      return updatedPaper;
                                    }
                                    return item;
                                  })
                                );
                                notify(`Requested revision on "${paper.title}".`, 'info');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Request Revision
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* INSTITUTION: QUOTA & PAYMENT RENEWAL */}
            {currentUser.role === 'institution' && activeInstitution && activeTab === 'quota' && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Annual Quota & Plan Renewal</h2>
                  <p className="text-sm text-slate-500">Each institution can create up to 100 question papers per year. To renew, complete payment and submit your transaction reference for Admin approval.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold uppercase text-indigo-600">Current Annual Subscription</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">{activeInstitution.papersUsed} / {activeInstitution.annualQuota} Papers Used</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                      Expires: {activeInstitution.planExpiry}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${activeInstitution.papersUsed >= 95 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(100, (activeInstitution.papersUsed / activeInstitution.annualQuota) * 100)}%` }}
                    />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!renewalPaymentRef.trim()) {
                        notify('Please enter a valid Payment Transaction ID / Reference.', 'error');
                        return;
                      }
                      const req = {
                        id: `ren-${Date.now()}`,
                        institutionId: activeInstitution.id,
                        institutionName: activeInstitution.name,
                        amount: Number(renewalAmount) || 4999,
                        currency: 'INR',
                        paymentRef: renewalPaymentRef.trim(),
                        requestedAt: new Date().toISOString().split('T')[0],
                        status: 'pending'
                      };
                      setRenewalRequests((prev) => [req, ...prev]);
                      persistDoc('renewalRequests', req.id, req);
                      setInstitutions((prev) =>
                        prev.map((i) => {
                          if (i.id === activeInstitution.id) {
                            const updatedInst = { ...i, renewalPending: true };
                            persistDoc('institutions', updatedInst.id, updatedInst);
                            return updatedInst;
                          }
                          return i;
                        })
                      );
                      setRenewalPaymentRef('');
                      notify('Payment submitted & autosaved! Admin will verify and renew your 100-paper annual plan.', 'success');
                    }}
                    className="pt-4 border-t border-slate-200 space-y-3"
                  >
                    <div className="text-sm font-bold text-slate-900">Submit Plan Renewal Payment (100 Question Papers / 1 Year)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Renewal Fee (INR)</label>
                        <input
                          type="number"
                          value={renewalAmount}
                          onChange={(e) => setRenewalAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Transaction Reference *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., UPI-8392019482 / NEFT Ref"
                          value={renewalPaymentRef}
                          onChange={(e) => setRenewalPaymentRef(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" /> Submit Payment for Admin Renewal
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ================================================================
                FACULTY PORTAL VIEWS
            ================================================================ */}
            {currentUser.role === 'faculty' && activeInstitution && activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Welcome, {currentUser.name}</h1>
                    <p className="text-sm text-slate-500">
                      {activeInstitution.name} • Department: <strong>{currentUser.department}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => { setEditingPaper(null); setBuilderOpen(true); }}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center gap-2 self-start"
                  >
                    <Plus className="w-4 h-4" /> Create New Question Paper
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">My Question Papers</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {papers.filter((p) => p.createdById === currentUser.id).length}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Verified by Institution</div>
                    <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                      {papers.filter((p) => p.createdById === currentUser.id && p.status === 'verified').length}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">Institution Annual Quota</div>
                    <div className="text-3xl font-extrabold text-indigo-700 mt-1">
                      {activeInstitution.annualQuota - activeInstitution.papersUsed} left
                    </div>
                  </div>
                </div>

                {/* Feature Guide Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900">1. Pick Chapter & Topic Questions</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Browse Admin-curated syllabus chapters and topics, filter questions by marks, and assemble them into your institution's custom paper layout.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900">2. AI Chatbot + Firebase Storage + Word & PDF Export</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Use the integrated AI Chatbot to generate custom questions for exact marks in any language, select & add them with one click, and download as Word (.doc) or PDF.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SHARED PAPERS LIST (FOR BOTH INSTITUTION & FACULTY) */}
            {((currentUser.role === 'institution' && activeTab === 'papers') ||
              (currentUser.role === 'faculty' && activeTab === 'papers')) &&
              activeInstitution && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      {currentUser.role === 'institution' ? 'All Institution Question Papers' : 'My Created Question Papers'}
                    </h2>
                    <p className="text-sm text-slate-500">Edit papers, preview with Institution layout, or download directly as Word (.doc) and PDF.</p>
                  </div>
                  <button
                    onClick={() => { setEditingPaper(null); setBuilderOpen(true); }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 self-start"
                  >
                    <Plus className="w-4 h-4" /> Create Question Paper
                  </button>
                </div>

                <div className="space-y-3">
                  {papers
                    .filter((p) =>
                      currentUser.role === 'institution'
                        ? p.institutionId === activeInstitution.id
                        : p.createdById === currentUser.id
                    )
                    .map((paper) => {
                      const cls = curriculum.find((c) => c.id === paper.classId);
                      const sub = cls?.subjects.find((s) => s.id === paper.subjectId);
                      const totalM = paper.questions.reduce((acc, q) => acc + Number(q.marks || 0), 0);

                      return (
                        <div key={paper.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                paper.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : paper.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {paper.status === 'verified' ? 'Verified' : paper.status === 'rejected' ? 'Needs Revision' : 'Pending Verification'}
                              </span>
                              <span className="text-xs text-slate-500">{paper.createdAt} • By {paper.createdByName}</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900">{paper.title}</h3>
                            <p className="text-xs text-slate-500">
                              {cls?.name} • {sub?.name} • {paper.questions.length} Questions • <strong>{totalM} Marks</strong>
                            </p>
                            {paper.reviewNote && (
                              <p className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block mt-1">
                                Note: {paper.reviewNote}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => setPreviewModalPaper(paper)}
                              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                            <button
                              onClick={() => { setEditingPaper(paper); setBuilderOpen(true); }}
                              className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                            >
                              Edit Paper
                            </button>
                            <button
                              onClick={() => exportPaperToWord(paper, activeInstitution, cls?.name || '', sub?.name || '', false, customFonts)}
                              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Word
                            </button>
                            <button
                              onClick={() => exportPaperToPdfPrint(paper, activeInstitution, cls?.name || '', sub?.name || '', false, customFonts)}
                              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> PDF
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* FACULTY: READ-ONLY SYLLABUS & QUESTION BANK EXPLORER */}
            {currentUser.role === 'faculty' && activeTab === 'syllabus' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Syllabus Contents & Question Bank</h2>
                  <p className="text-sm text-slate-500">Explore Admin-published Class → Subject → Chapter → Topic syllabus notes and available questions.</p>
                </div>

                <div className="space-y-4">
                  {curriculum.map((cls) => (
                    <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                      <h3 className="text-lg font-extrabold text-indigo-900">{cls.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cls.subjects.map((sub) => (
                          <div key={sub.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="font-bold text-sm text-slate-900">{sub.name}</div>
                            {sub.chapters.map((ch) => (
                              <div key={ch.id} className="pl-3 border-l-2 border-indigo-400 space-y-1">
                                <div className="text-xs font-bold text-indigo-800">{ch.name}</div>
                                {ch.topics.map((tp) => (
                                  <div key={tp.id} className="text-xs text-slate-600">
                                    • <strong>{tp.name}:</strong> {tp.content}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ====================================================================
          MODAL: FULL A4 QUESTION PAPER PREVIEW & EXPORT
      ==================================================================== */}
      {previewModalPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-slate-900 text-sm">{previewModalPaper.title}</div>
              <div className="flex items-center gap-2">
                {(() => {
                  const inst = institutions.find((i) => i.id === previewModalPaper.institutionId) || activeInstitution;
                  const cls = curriculum.find((c) => c.id === previewModalPaper.classId);
                  const sub = cls?.subjects.find((s) => s.id === previewModalPaper.subjectId);
                  return (
                    <>
                      <button
                        onClick={() => exportPaperToWord(previewModalPaper, inst, cls?.name || '', sub?.name || '', false, customFonts)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Word (.doc)
                      </button>
                      <button
                        onClick={() => exportPaperToPdfPrint(previewModalPaper, inst, cls?.name || '', sub?.name || '', false, customFonts)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> PDF / Print
                      </button>
                    </>
                  );
                })()}
                <button
                  onClick={() => setPreviewModalPaper(null)}
                  className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              {(() => {
                const inst = institutions.find((i) => i.id === previewModalPaper.institutionId) || activeInstitution;
                const cls = curriculum.find((c) => c.id === previewModalPaper.classId);
                const sub = cls?.subjects.find((s) => s.id === previewModalPaper.subjectId);
                return (
                  <PaperPreviewCanvas
                    paper={previewModalPaper}
                    institution={inst}
                    className={cls?.name || ''}
                    subjectName={sub?.name || ''}
                    showAnswers={true}
                    customFonts={customFonts}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADMIN RESET PASSWORD FOR ANY LOGIN
      ==================================================================== */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">
              Reset Password for {passwordModalUser.name}
            </h3>
            <input
              type="text"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPasswordModalUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newPasswordInput.trim()) return;
                  if (passwordModalUser.type === 'institution') {
                    setInstitutions((prev) =>
                      prev.map((i) => {
                        if (i.id === passwordModalUser.id) {
                          const updatedInst = { ...i, password: newPasswordInput.trim() };
                          persistDoc('institutions', updatedInst.id, updatedInst);
                          return updatedInst;
                        }
                        return i;
                      })
                    );
                  } else {
                    setFaculties((prev) =>
                      prev.map((f) => {
                        if (f.id === passwordModalUser.id) {
                          const updatedFac = { ...f, password: newPasswordInput.trim() };
                          persistDoc('faculties', updatedFac.id, updatedFac);
                          return updatedFac;
                        }
                        return f;
                      })
                    );
                  }
                  notify(`Password updated & autosaved for ${passwordModalUser.name}!`, 'success');
                  setPasswordModalUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Save New Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
