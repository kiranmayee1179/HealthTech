import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ACTIVITY_FILE = path.join(os.tmpdir(), 'vitalcheck-activity.json');
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
let availableGeminiModels;

async function getGeminiModels(apiKey) {
  if (availableGeminiModels) return availableGeminiModels;

  const preferredModel = DEFAULT_GEMINI_MODEL.replace(/^models\//, '');
  const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const discoveredModels = [];
  if (modelsResponse.ok) {
    const modelsData = await modelsResponse.json();
    discoveredModels.push(...(modelsData.models || [])
      .filter(model => model.supportedGenerationMethods?.includes('generateContent') && /flash|pro/i.test(model.name || ''))
      .map(model => model.name.replace(/^models\//, '')));
  }

  availableGeminiModels = [...new Set([
    preferredModel,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    ...discoveredModels.filter(model => /flash|pro/i.test(model)).slice(0, 5)
  ])].slice(0, 8);
  return availableGeminiModels;
}

async function generateGemini(apiKey, promptText, generationConfig) {
  const models = await getGeminiModels(apiKey);
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          ...(generationConfig ? { generationConfig } : {})
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
        break;
      }

      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    }
  }

  console.warn('No Gemini model returned a usable response; using local clinical fallback.');
  return null;
}

function readActivity() {
  try {
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8'));
  } catch {
    return { sessions: [] };
  }
}

function writeActivity(activity) {
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(activity, null, 2));
}

function cleanActivityUser(user = {}) {
  return {
    email: String(user.email || '').slice(0, 160),
    name: String(user.name || '').slice(0, 120)
  };
}

app.get('/', (req, res) => {
  res.json({
    service: 'VitalCheck AI Backend',
    status: 'running',
    api: {
      intake: 'POST /api/ai/intake',
      mentalHealth: 'POST /api/ai/mental-health'
    }
  });
});

app.get('/api/activity/dashboard', (req, res) => {
  const activity = readActivity();
  const now = Date.now();
  const sessions = activity.sessions.map(session => ({
    ...session,
    isActive: !session.logoutAt,
    durationSeconds: Math.max(0, Math.floor(((session.logoutAt ? new Date(session.logoutAt).getTime() : now) - new Date(session.loginAt).getTime()) / 1000))
  }));

  res.json({
    generatedAt: new Date().toISOString(),
    activeUsers: sessions.filter(session => session.isActive).length,
    totalSessions: sessions.length,
    sessions: sessions.sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt))
  });
});

app.get('/admin/activity', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VitalCheck Activity</title>
  <style>
    body { margin: 0; padding: 32px; background: #07111f; color: #e5eef7; font: 15px system-ui, sans-serif; }
    main { max-width: 1100px; margin: auto; }
    h1 { margin-bottom: 6px; }
    .muted { color: #91a4b7; }
    .stats { display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap; }
    .stat { min-width: 180px; padding: 18px; border: 1px solid #1d354d; border-radius: 10px; background: #0d1b2b; }
    .number { display: block; font-size: 28px; font-weight: 700; color: #52e0bd; }
    table { width: 100%; border-collapse: collapse; background: #0d1b2b; border: 1px solid #1d354d; }
    th, td { padding: 13px 12px; border-bottom: 1px solid #1d354d; text-align: left; }
    th { color: #9ee8d5; font-size: 12px; text-transform: uppercase; }
    .active { color: #52e0bd; font-weight: 700; }
    .offline { color: #91a4b7; }
    button { margin: 16px 0; padding: 9px 14px; border: 0; border-radius: 7px; background: #32c7a4; color: #06131e; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <h1>VitalCheck User Activity</h1>
    <div class="muted">Local session monitor. Refresh to update the table.</div>
    <div class="stats"><div class="stat">Active users <span id="active" class="number">-</span></div><div class="stat">Total sessions <span id="total" class="number">-</span></div></div>
    <button onclick="loadActivity()">Refresh activity</button>
    <table><thead><tr><th>User</th><th>Login</th><th>Last seen</th><th>Logout</th><th>Duration</th><th>Status</th></tr></thead><tbody id="rows"></tbody></table>
  </main>
  <script>
    const formatDate = value => value ? new Date(value).toLocaleString() : '-';
    const formatDuration = seconds => { const minutes = Math.floor(seconds / 60); const hours = Math.floor(minutes / 60); return hours ? hours + 'h ' + (minutes % 60) + 'm' : minutes + 'm'; };
    async function loadActivity() {
      const data = await fetch('/api/activity/dashboard').then(response => response.json());
      document.querySelector('#active').textContent = data.activeUsers;
      document.querySelector('#total').textContent = data.totalSessions;
      document.querySelector('#rows').innerHTML = data.sessions.map(session => '<tr><td>' + (session.name || '-') + '<br><span class="muted">' + session.email + '</span></td><td>' + formatDate(session.loginAt) + '</td><td>' + formatDate(session.lastSeenAt) + '</td><td>' + formatDate(session.logoutAt) + '</td><td>' + formatDuration(session.durationSeconds) + '</td><td class="' + (session.isActive ? 'active' : 'offline') + '">' + (session.isActive ? 'Active' : 'Logged out') + '</td></tr>').join('');
    }
    loadActivity();
  </script>
</body>
</html>`);
});

app.post('/api/activity/login', (req, res) => {
  const { email, name, sessionId } = req.body || {};
  if (!email || !sessionId) return res.status(400).json({ error: 'email and sessionId are required' });

  const activity = readActivity();
  const user = cleanActivityUser({ email, name });
  const existing = activity.sessions.find(session => session.sessionId === sessionId);
  if (!existing) {
    activity.sessions.push({ sessionId: String(sessionId).slice(0, 100), ...user, loginAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), logoutAt: null });
    writeActivity(activity);
  }
  res.json({ ok: true });
});

app.post('/api/activity/heartbeat', (req, res) => {
  const { sessionId } = req.body || {};
  const activity = readActivity();
  const session = activity.sessions.find(item => item.sessionId === sessionId && !item.logoutAt);
  if (session) {
    session.lastSeenAt = new Date().toISOString();
    writeActivity(activity);
  }
  res.json({ ok: true });
});

app.post('/api/activity/logout', (req, res) => {
  const { sessionId } = req.body || {};
  const activity = readActivity();
  const session = activity.sessions.find(item => item.sessionId === sessionId && !item.logoutAt);
  if (session) {
    session.lastSeenAt = new Date().toISOString();
    session.logoutAt = new Date().toISOString();
    writeActivity(activity);
  }
  res.json({ ok: true });
});

const EMERGENCY_KEYWORDS = [
  'chest pain', 'pressure in chest', 'radiating pain left arm', 'left arm pain', 'heart attack', 'heart attack symptoms', 'heart attack signs', 'cardiac arrest', 'heart stopped',
  'shortness of breath', 'can\'t breathe', 'cannot breathe', 'difficulty breathing',
  'face drooping', 'slurred speech', 'arm weakness', 'stroke',
  'severe bleeding', 'uncontrolled bleeding', 'coughing up blood',
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'self harm', 'crisis hotline', 'crisis support',
  'anaphylaxis', 'throat closing', 'swollen tongue', 'unconscious', 'passed out',
  'gunde noppi', 'gunde lo pain', 'oopiri aadadam ledu', 'chavali',
  'seene me dard', 'chhati me dard', 'saans nahi aa rahi', 'aatmhatya',
  'dolor de pecho', 'no puedo respirar', 'suicidio', 'sangrado grave',
  'douleur thoracique', 'brustschmerzen', 'గుండె నొప్పి', 'छाती में दर्द'
];

function detectEmergency(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}

function detectResponseLanguage(text, requestedLanguage = 'Auto') {
  if (requestedLanguage !== 'Auto') return requestedLanguage;
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu_Native';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi_Native';

  const lower = (text || '').toLowerCase();
  const teluguWords = ['naaku', 'naku', 'noppiga', 'vasthundi', 'undi', 'cheyali', 'veskovacha', 'period pain', 'kadupu noppi', 'thala noppi', 'enduku', 'enti', 'ela'];
  if (teluguWords.some(word => lower.includes(word))) return 'Telugu_Tenglish';
  if (['mujhe', 'sar dard', 'bukhar', 'kya karu', 'paani'].some(word => lower.includes(word))) return 'Hindi_Hinglish';
  if (lower.includes('tengo') || lower.includes('dolor de')) return 'Spanish';
  if (lower.includes('mal à') || lower.includes('mal de tête')) return 'French';
  return 'English';
}

function buildLocalIntakeResponse(messages, userProfile, language = 'English') {
  const userMessages = messages.filter(message => message.role === 'user');
  const latest = userMessages.at(-1)?.content?.trim() || '';
  const lower = latest.toLowerCase();
  const previousContext = userMessages.slice(0, -1).map(message => message.content).join(' ');
  const combinedText = `${previousContext} ${latest}`.toLowerCase();
  const hasDetails = /\b(day|days|hour|hours|week|weeks|mild|moderate|severe|fever|temperature|vomit|vomiting|pain|rash|cough|dizzy|breath|itch|swelling)\b/i.test(combinedText);
  const isFollowUp = userMessages.length > 1 && hasDetails;
  const patientName = userProfile.name || 'Patient';

  const topics = [
    {
      matches: ['rash', 'itchy skin', 'itching', 'hives'],
      name: 'skin changes or a rash',
      possibilities: 'irritation, contact allergy, insect bites, or another skin condition',
      questions: 'Is it spreading, painful, blistering, or associated with swelling of your lips or face?'
    },
    {
      matches: ['headache', 'head pain', 'migraine'],
      name: 'head pain',
      possibilities: 'tension, dehydration, poor sleep, eye strain, migraine, or an infection',
      questions: 'Did it begin suddenly, and do you have fever, vision changes, weakness, confusion, or repeated vomiting?'
    },
    {
      matches: ['fever', 'temperature', 'chills', 'hot and cold'],
      name: 'fever or chills',
      possibilities: 'an infection or another inflammatory illness',
      questions: 'What is the measured temperature, how long has it lasted, and what other symptoms are present?'
    },
    {
      matches: ['cough', 'sore throat', 'cold', 'runny nose', 'congestion'],
      name: 'a respiratory symptom',
      possibilities: 'a viral infection, allergy, irritation, or asthma-related symptoms',
      questions: 'Do you have trouble breathing, chest pain, high fever, or blood when coughing?'
    },
    {
      matches: ['stomachache', 'stomach ache', 'stomach pain', 'abdominal pain', 'belly pain', 'diarrhea', 'constipation', 'nausea', 'vomit'],
      name: 'a digestive symptom',
      possibilities: 'indigestion, infection, constipation, food-related irritation, or another abdominal condition',
      questions: 'Where exactly is the discomfort, and can you keep fluids down?'
    },
    {
      matches: ['back pain', 'neck pain', 'joint pain', 'muscle pain'],
      name: 'muscle or joint pain',
      possibilities: 'strain, posture, overuse, or inflammation',
      questions: 'Did it follow an injury, and do you have weakness, numbness, fever, or trouble controlling your bladder or bowel?'
    },
    {
      matches: ['dizzy', 'dizziness', 'lightheaded', 'faint'],
      name: 'dizziness or lightheadedness',
      possibilities: 'dehydration, low blood pressure, an inner-ear problem, medication effects, or other causes',
      questions: 'Did you faint, have chest pain, severe headache, weakness, trouble speaking, or an irregular heartbeat?'
    },
    {
      matches: ['toothache', 'tooth pain', 'tooth hurts', 'dental pain', 'gum pain', 'gum swollen'],
      name: 'tooth or gum pain',
      possibilities: 'tooth decay, gum irritation, infection, or sensitivity',
      questions: 'Is there facial swelling, fever, pus, difficulty opening your mouth, or trouble swallowing?'
    },
    {
      matches: ['eye pain', 'red eye', 'blurred vision', 'eye irritation'],
      name: 'an eye symptom',
      possibilities: 'dryness, irritation, allergy, infection, or eye strain',
      questions: 'Is your vision changing, is the pain severe, or was there an injury or chemical exposure?'
    },
    {
      matches: ['ear pain', 'earache', 'ringing in my ear', 'hearing loss'],
      name: 'an ear symptom',
      possibilities: 'wax blockage, congestion, infection, irritation, or pressure changes',
      questions: 'Do you have fever, discharge, sudden hearing loss, severe dizziness, or recent injury?'
    },
    {
      matches: ['burning urine', 'burns when i urinate', 'burning when i pee', 'painful urination', 'uti', 'urine pain', 'blood in urine'],
      name: 'a urinary symptom',
      possibilities: 'urinary irritation, a urinary infection, dehydration, or another urinary condition',
      questions: 'Do you have fever, back or side pain, vomiting, or blood in the urine?'
    },
    {
      matches: ['period pain', 'menstrual pain', 'cramps', 'heavy bleeding'],
      name: 'a menstrual or pelvic symptom',
      possibilities: 'normal menstrual cramping, hormonal changes, or another gynecologic condition',
      questions: 'Is the pain severe or one-sided, could you be pregnant, or are you soaking pads unusually quickly?'
    },
    {
      matches: ['allergy', 'sneezing', 'watery eyes', 'blocked nose'],
      name: 'an allergy or nasal symptom',
      possibilities: 'seasonal allergy, dust or other irritation, or a viral infection',
      questions: 'Do you have facial swelling, wheezing, trouble breathing, fever, or thick discolored discharge?'
    }
  ];

  const latestTopic = topics.find(item => item.matches.some(match => lower.includes(match)));
  const contextTopic = topics.find(item => item.matches.some(match => combinedText.includes(match)));
  const isShortFollowUp = latest.length < 45 && /\b(it|this|that|symptom|pain|deniki|enti|ela)\b/i.test(lower);
  const topic = latestTopic || (isShortFollowUp ? contextTopic : null);
  const concern = topic?.name || latest || 'this concern';

  if (language === 'Telugu_Tenglish') {
    if (topic) {
      return {
        isEmergency: false,
        isFinalTriage: false,
        followUpQuestion: `Meeru ${concern} gurinchi chepparu. Daaniki ${topic.possibilities} lanti causes undavachu; chat dwara exact cause confirm cheyyalem. ${topic.questions} Idi eppati nundi undi, 1-10 lo entha severe ga undi?`
      };
    }
    return {
      isEmergency: false,
      isFinalTriage: false,
      followUpQuestion: `Meeru cheppina "${latest}" gurinchi ardham cheskunnanu. Chat dwara exact cause confirm cheyyalem. Main symptom enti, ekkada undi, eppati nundi undi, mariyu 1-10 lo entha severe ga undi?`
    };
  }

  if (language === 'Telugu_Native') {
    return {
      isEmergency: false,
      isFinalTriage: false,
      followUpQuestion: `మీరు ${concern} గురించి చెప్పారు. చాట్ ద్వారా ఖచ్చితమైన కారణాన్ని నిర్ధారించలేను. ఇది ఎప్పటి నుంచి ఉంది, నొప్పి 1 నుంచి 10లో ఎంతగా ఉంది, మరియు ఇతర లక్షణాలు ఏమైనా ఉన్నాయా?`
    };
  }

  if (language === 'Hindi_Hinglish' || language === 'Hindi_Native') {
    return {
      isEmergency: false,
      isFinalTriage: false,
      followUpQuestion: language === 'Hindi_Native'
        ? `आपने ${concern} के बारे में बताया है। चैट से सही कारण की पुष्टि नहीं की जा सकती। यह कब से है, इसकी तीव्रता 1 से 10 में कितनी है, और क्या कोई अन्य लक्षण हैं?`
        : `Aapne ${concern} ke baare mein bataya hai. Chat se exact cause confirm nahi kiya ja sakta. Yeh kab se hai, severity 1 se 10 mein kitni hai, aur koi aur symptoms hain?`
    };
  }

  if (language === 'Spanish' || language === 'French') {
    return {
      isEmergency: false,
      isFinalTriage: false,
      followUpQuestion: language === 'Spanish'
        ? `Entiendo que preguntas sobre ${concern}. No puedo confirmar la causa por chat. ¿Desde cuándo ocurre, qué intensidad tiene del 1 al 10 y qué otros síntomas presentas?`
        : `Je comprends que vous parlez de ${concern}. Je ne peux pas confirmer la cause par chat. Depuis quand cela dure-t-il, quelle est l'intensité sur 10 et quels autres symptômes avez-vous?`
    };
  }

  if (isFollowUp) {
    return {
      isEmergency: false,
      isFinalTriage: true,
      triageCard: {
        urgency: 'See a Doctor Soon',
        urgencyColor: 'amber',
        summary: `${patientName}, your reported ${concern} needs monitoring. The exact cause cannot be confirmed from chat.`,
        explanations: [
          topic ? `Common possibilities include ${topic.possibilities}.` : 'Several causes are possible based on the information provided.',
          'A clinician should review symptoms that persist, worsen, recur, or interfere with normal activities.'
        ],
        nextSteps: 'Record when it started, what makes it better or worse, and any new symptoms. Arrange a clinician visit if it persists or worsens. Seek urgent care for severe or rapidly worsening symptoms.'
      }
    };
  }

  if (topic) {
    return {
      isEmergency: false,
      isFinalTriage: false,
      followUpQuestion: `I understand you are asking about ${concern}. It can have several causes, including ${topic.possibilities}; I cannot confirm which one from chat alone. ${topic.questions} Also, how long has it been happening and how severe is it from 1 to 10?`
    };
  }

  return {
    isEmergency: false,
    isFinalTriage: false,
    followUpQuestion: `I understand you are asking about "${latest}". I cannot confirm the cause from chat alone. What is the main symptom, where do you feel it, how long has it been happening, and how severe is it from 1 to 10?`
  };
}

app.post('/api/ai/intake', async (req, res) => {
  try {
    const { messages = [], userProfile = {}, language: requestedLanguage = 'Auto', isQuestion = false } = req.body;
    const latestUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const language = detectResponseLanguage(latestUserMessage, requestedLanguage);

    // Step 1: Immediate Red Flag Check
    if (detectEmergency(latestUserMessage)) {
      return res.json({
        isEmergency: true,
        emergencyTitle: 'IMMEDIATE MEDICAL / CRISIS ALERT',
        emergencyMessage: 'Your described symptoms suggest a potential medical emergency. VitalCheck AI cannot safely evaluate emergencies.',
        actions: [
          'Call 112 (India emergency services) immediately.',
          'For emotional distress in India, call Tele-MANAS at 14416.'
        ],
        hotlines: [
          { name: 'India Emergency Services', number: '112' },
          { name: 'Tele-MANAS', number: '14416' }
        ]
      });
    }

    const userTurns = messages.filter(m => m.role === 'user').length;
    const geminiKey = process.env.GEMINI_API_KEY;

    const age = userProfile.age || 34;
    const conditions = Array.isArray(userProfile.existingConditions) ? userProfile.existingConditions.join(', ') : (userProfile.existingConditions || 'None');

    if (geminiKey) {
      const promptText = `
    SYSTEM PROMPT - VITALCHECK AI CLINICAL GUIDANCE ASSISTANT:
    You provide careful, patient-centered health guidance similar in communication style to a good primary-care clinician, but you are not a doctor and must not diagnose, prescribe, or claim certainty. Be clinically useful, calm, direct, and specific.

    RESPONSE RULES:
    1. Start by answering the user's exact latest question or concern. Never substitute a generic headache, stress, or wellness response for a different symptom.
    2. Use the full conversation, but treat the latest user message as the priority. Acknowledge concrete details such as location, duration, severity, triggers, associated symptoms, medicines, pregnancy possibility, age, and medical conditions when provided.
    3. Separate what is known from possible explanations. Use phrases such as "can be caused by" and "I cannot confirm the cause from chat". Do not diagnose.
    4. If important information is missing, ask no more than 2 focused follow-up questions that would change the urgency or next step. Do not ask questions that were already answered.
    5. Give practical, low-risk next steps tailored to the complaint. Do not recommend prescription changes or a specific medication dose. Mention pharmacist or clinician review when medication advice is relevant.
    6. Screen for red flags relevant to the complaint. If present or possibly present, recommend local emergency services or urgent care clearly and immediately.
    7. Use triage conservatively: "Self-Care" only for mild symptoms without red flags and with reasonable monitoring; use "See a Doctor Soon" for persistent, worsening, recurrent, or unexplained symptoms; use "Seek Urgent Care Now" for potentially serious symptoms.
    8. Maintain 100% language and script consistency with the user's latest message. Do not translate Tenglish/Romanized Telugu into English.
    9. Avoid filler, flattery, emojis, and repeated templates. Sound like a clinician explaining the next sensible step to a patient.
    10. Reply entirely in this requested language and script: ${language}. For Telugu_Tenglish or Hindi_Hinglish, use Romanized text. For Telugu_Native or Hindi_Native, use the native script.
    11. Answer all health-related questions directly, including questions about symptoms, diseases, medicines, side effects, prevention, tests, treatment options, recovery, and when to see a clinician. Do not force every question into symptom intake.
    12. If the user asks about a disease without describing personal symptoms, explain what it commonly means, typical symptoms, common causes or risk factors, usual evaluation, and when urgent care is needed. Do not claim that the user has it.

PATIENT PROFILE CONTEXT:
- Name: ${userProfile.name || 'Patient'}
- Age: ${age} years old
- Conditions: ${conditions}

CONVERSATION HISTORY:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond ONLY with valid JSON:
{
  "isFinalTriage": boolean,
  "followUpQuestion": "string that directly answers the latest message and includes focused questions only when needed",
  "triageCard": {
    "urgency": "Self-Care" | "See a Doctor Soon" | "Seek Urgent Care Now",
    "urgencyColor": "green" | "amber" | "red",
    "summary": "Direct summary addressing user's question/input in patient's language & script",
    "explanations": ["Plausible simple possibility 1", "Plausible simple possibility 2"],
    "nextSteps": "Clear practical next steps, monitoring advice, and when to seek care in patient's language & script"
  }
}
`;

      const jsonText = await generateGemini(geminiKey, promptText, { responseMimeType: 'application/json' });
      if (jsonText) {
        try {
          const parsed = JSON.parse(jsonText);
          if (typeof parsed.followUpQuestion === 'string' || parsed.isFinalTriage === true) {
            return res.json({ isEmergency: false, ...parsed });
          }
        } catch (parseError) {
          console.error('AI returned invalid intake JSON:', parseError);
        }
      }
    }

    // Local clinical fallback keeps the chat useful when no model key is configured.
    return res.json(buildLocalIntakeResponse(messages, userProfile, language));

  } catch (err) {
    console.error('API Intake Error:', err);
    res.status(500).json({ isEmergency: false, isFinalTriage: false, followUpQuestion: 'Could you rephrase your question for me?' });
  }
});

app.post('/api/ai/mental-health', async (req, res) => {
  try {
    const { messages = [], userProfile = {}, language: requestedLanguage = 'Auto' } = req.body;
    const latestUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const language = detectResponseLanguage(latestUserMessage, requestedLanguage);

    // Step 1: Crisis Check
    if (detectEmergency(latestUserMessage)) {
      const isTelugu = language === 'Telugu_Tenglish' || language === 'Telugu_Native';
      const isTeluguNative = language === 'Telugu_Native';
      return res.json({
        isCrisis: true,
        reply: isTelugu
          ? `Meeru ippudu chala ibbandhi lo unnattu anipisthondi. Mee jeevitham mukhyam. Dayachesi India lo ippude 14416 Tele-MANAS ki call cheyyandi; trained counselors 24/7 support chestharu.`
          : `I hear how much distress you are experiencing right now. Please know your life is precious and help is available. Trained counselors are ready to support you 24/7 with complete confidentiality.`,
        resources: [
          { name: 'Tele-MANAS', contact: 'Call 14416 (India, 24/7)' },
          { name: 'Tele-MANAS alternate number', contact: 'Call 1800-891-4416' }
        ]
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const promptText = `
SYSTEM PROMPT - VITALCHECK MENTAL HEALTH & CONVERSATIONAL COMPANION:
You are a warm, professional health-support agent with the communication style of a careful primary-care clinician. Be empathetic and friendly, but do not diagnose, prescribe, or pretend to replace a licensed professional. Explain uncertainty clearly and recommend appropriate care when symptoms or emotional distress require it.

CRITICAL INSTRUCTIONS:
1. UNDERSTAND AND RESPOND DIRECTLY TO THE USER'S EXACT MESSAGE (e.g. food cravings like wanting a burger, stress, daily thoughts, emotions, hobbies, or general questions).
2. DO NOT IGNORE OR DISTRACT FROM THE USER'S PROMPT. If they talk about eating a burger, discuss comfort food, appetite, emotional connection to food, or simply have a lighthearted, warm conversation!
3. Format your response cleanly using Markdown (**bolding** key points, using bullet points when offering suggestions).
4. Keep the tone supportive, validating, and conversational.
5. Reply entirely in the requested language: ${language}. If the user writes Telugu in Roman letters, reply in Tenglish/Romanized Telugu. Never switch to English unless the user does.

USER CONVERSATION HISTORY:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Reply directly to the user in a natural, engaging paragraph or bulleted message.
`;

      const text = await generateGemini(geminiKey, promptText);
      if (text) {
        return res.json({ isCrisis: false, reply: text });
      }
    }

    // Local fallback keeps the conversation relevant when no model key is configured.
    const lower = latestUserMessage.toLowerCase();
    const previousUserMessages = messages.filter(message => message.role === 'user').slice(0, -1);
    const conversationText = `${previousUserMessages.map(message => message.content).join(' ')} ${lower}`.toLowerCase();
    const isTelugu = language === 'Telugu_Tenglish';
    const isTeluguNative = language === 'Telugu_Native';
    const isHindi = language === 'Hindi_Hinglish' || language === 'Hindi_Native';
    const isSpanish = language === 'Spanish';
    const isFrench = language === 'French';

    if (isTeluguNative) {
      const teluguReply = conversationText.includes('headache') || conversationText.includes('తలనొప్పి')
        ? `మీకు తలనొప్పి ఉందని అర్థమవుతోంది. నీరు తగ్గడం, ఒత్తిడి, నిద్రలేమి, స్క్రీన్ వల్ల కళ్లపై ఒత్తిడి లేదా మైగ్రేన్ వంటి కారణాలు ఉండవచ్చు; చాట్ ద్వారా ఖచ్చితమైన కారణాన్ని నిర్ధారించలేను. ఇది ఎప్పటి నుంచి ఉంది, 1 నుంచి 10లో నొప్పి ఎంతగా ఉంది, జ్వరం, వాంతులు, చూపు మారడం, బలహీనత లేదా గందరగోళం ఉన్నాయా? అకస్మాత్తుగా లేదా చాలా తీవ్రమైన నొప్పి ఉంటే వెంటనే వైద్య సహాయం పొందండి.`
        : `మీరు చెప్పిన విషయం అర్థమవుతోంది: "${latestUserMessage}". మిమ్మల్ని ఎలాంటి తీర్పు లేకుండా వినడానికి నేను ఇక్కడ ఉన్నాను. ఇది ఎప్పటి నుంచి ఉంది, ప్రస్తుతం మీకు భావోద్వేగంగా మాట్లాడటం కావాలా లేదా ఉపయోగకరమైన తదుపరి చర్యల గురించి తెలుసుకోవాలా?`;
      return res.json({ isCrisis: false, reply: teluguReply });
    }

    if (isTelugu) {
      const latestMentionsStomach = lower.includes('stomachache') || lower.includes('stomach ache') || lower.includes('stomach pain') || lower.includes('belly pain') || lower.includes('kadupu noppi') || lower.includes('kadupu') || lower.includes('gastric');
      const latestMentionsHeadache = lower.includes('headache') || lower.includes('head pain') || lower.includes('thala noppi');
      const latestMentionsFever = lower.includes('fever') || lower.includes('jwaram') || lower.includes('temperature');
      const latestMentionsCough = lower.includes('cough') || lower.includes('daggu') || lower.includes('cold') || lower.includes('sore throat');
      const latestMentionsRash = lower.includes('rash') || lower.includes('itching') || lower.includes('itchy');
      const latestMentionsTooth = lower.includes('tooth') || lower.includes('dental') || lower.includes('gum');
      const latestMentionsUrinary = lower.includes('urine') || lower.includes('urinate') || lower.includes('pee') || lower.includes('uti');
      const latestMentionsBack = lower.includes('back pain') || lower.includes('neck pain') || lower.includes('muscle pain');
      const latestMentionsLegPain = lower.includes('leg pain') || lower.includes('leg ache') || lower.includes('kalu noppi') || lower.includes('joint pain') || lower.includes('knee pain');
      const latestMentionsAllergy = lower.includes('allergy') || lower.includes('sneezing') || lower.includes('watery eyes');
      const isShortFollowUp = lower.length < 55 && (lower.includes('symptom') || lower.includes('deniki') || lower.includes('enti') || lower.includes('ela') || lower.includes('practical steps') || lower.includes('cheyali'));
      const periodContext = conversationText.includes('period pain') || conversationText.includes('menstrual pain') || conversationText.includes('cramps') || conversationText.includes('monthly pain');

      if (lower.includes('period pain') || lower.includes('menstrual pain') || lower.includes('period cramps') || lower.includes('monthly pain') || (periodContext && isShortFollowUp)) {
        return res.json({
          isCrisis: false,
          reply: `Period pain / menstrual cramps chala common, kani pain severe ga unte ignore cheyyakandi. Warm compress, gentle walking or stretching, rest, and fluids help avvachu. Tablet gurinchi: label instructions follow cheyyandi and pharmacist or doctor ni adagandi; ibuprofen lanti anti-inflammatory tablets pregnancy possibility, stomach ulcer, kidney disease, blood thinners, or allergy unte avoid cheyyali. Paracetamol kuda label dose kanna ekkuva theeskokandi. Pain chala severe ga unte, one-side ga unte, heavy bleeding, fainting, fever, vomiting, or pregnancy possibility unte urgent medical care theeskondi. Mee pain 1-10 lo entha, bleeding normal ga unda, mariyu pregnancy possibility unda?`
        });
      }

      if (latestMentionsStomach) {
        return res.json({
          isCrisis: false,
          reply: `Mee message lo stomachache / kadupu noppi gurinchi chepparu. Gas, indigestion, constipation, food irritation, infection, leda vere abdominal causes valla undavachu; chat dwara exact cause confirm cheyyalem. Noppi ekkada undi, eppati nundi undi, 1-10 lo entha severe ga undi? Vomiting, fever, blood in stool, hard/swollen stomach, leda fluids keep cheyyalekapovadam unnaya? Severe or worsening pain ayite urgent medical care theeskondi.`
        });
      }

      if (latestMentionsFever) {
        return res.json({ isCrisis: false, reply: `Mee message lo fever / jwaram gurinchi chepparu. Infection, dehydration, leda vere illness valla fever ravachu; temperature measure cheyyandi, fluids thagandi, rest theeskondi. Temperature entha undi, enni rojulu ga undi, mariyu cough, vomiting, rash, breathing problem unnaya? Very high fever, confusion, stiff neck, severe weakness, or breathing trouble ayite urgent care theeskondi.` });
      }

      if (latestMentionsCough) {
        return res.json({ isCrisis: false, reply: `Mee message lo cough / cold symptoms gurinchi chepparu. Viral infection, allergy, throat irritation, leda asthma valla undavachu; chat dwara exact cause confirm cheyyalem. Cough enni rojulu ga undi, fever or phlegm unda, mariyu breathing difficulty or chest pain unnaya? Breathing kastam, blue lips, or coughing blood ayite emergency help theeskondi.` });
      }

      if (latestMentionsRash) {
        return res.json({ isCrisis: false, reply: `Mee message lo rash or itching gurinchi chepparu. Skin irritation, allergy, insect bite, leda infection valla undavachu. Rash ekkuva spread avuthonda, painful ga or blistering ga unda, fever or face/lip swelling unda? Face swelling or breathing trouble ayite immediate emergency care theeskondi.` });
      }

      if (latestMentionsTooth) {
        return res.json({ isCrisis: false, reply: `Mee message lo tooth or gum problem gurinchi chepparu. Cavity, gum irritation, sensitivity, leda infection valla pain ravachu. Face swelling, fever, pus, mouth open cheyyadam kastam, or swallowing difficulty unnaya? Ivi unte urgent dentist or medical care theeskondi; pain continue ayite dentist appointment arrange cheyyandi.` });
      }

      if (latestMentionsUrinary) {
        return res.json({ isCrisis: false, reply: `Mee message lo urinary problem gurinchi chepparu. Urinary irritation, UTI, dehydration, leda vere urinary condition valla burning or pain undavachu. Fever, back/side pain, vomiting, or blood in urine unnaya? Ee symptoms unte same-day medical review avasaram; fluids thagandi unless doctor fluid restriction cheppunte.` });
      }

      if (latestMentionsBack) {
        return res.json({ isCrisis: false, reply: `Mee message lo muscle or back/neck pain gurinchi chepparu. Strain, posture, overuse, or inflammation valla undavachu. Injury taruvatha start ayinda, numbness, weakness, fever, or bladder/bowel control problem unnaya? Weakness or bladder/bowel changes ayite urgent care theeskondi; otherwise rest and gentle movement try chesi pain continue ayite doctor ni consult cheyyandi.` });
      }

      if (latestMentionsLegPain) {
        return res.json({ isCrisis: false, reply: `Mee message lo leg or joint pain gurinchi chepparu. Muscle strain, overuse, joint irritation, nerve problem, or injury valla undavachu. Injury ayinda, swelling/redness, one-leg sudden swelling, numbness, weakness, fever, or walking difficulty unnaya? One leg sudden ga swollen/red/warm ga undi, or breathing problem/chest pain unte emergency care theeskondi. Otherwise rest, leg elevate cheyyadam, and gentle movement try chesi pain continue ayite doctor ni consult cheyyandi.` });
      }

      if (latestMentionsAllergy) {
        return res.json({ isCrisis: false, reply: `Mee message lo allergy symptoms gurinchi chepparu. Seasonal allergy, dust, irritation, or viral infection valla sneezing and watery eyes ravachu. Face/lip swelling, wheezing, breathing difficulty, or high fever unnaya? Breathing problem or swelling ayite emergency care theeskondi; otherwise trigger ni avoid chesi pharmacist ni safe allergy treatment gurinchi adagandi.` });
      }

      if (latestMentionsHeadache || (isShortFollowUp && conversationText.includes('headache'))) {
        return res.json({
          isCrisis: false,
          reply: `Mee message lo headache / thala noppi gurinchi chepparu. Idi dehydration, stress, nidra thakkuva, screen strain, leda migraine valla ravachu; chat dwara exact cause confirm cheyyalem. Headache eppati nundi undi, 1-10 lo entha severe ga undi, mariyu fever, vomiting, vision changes, weakness leda confusion unnaya? Severe ga leda sudden ga start ayite urgent medical care theeskondi.`
        });
      }

      if (lower.includes('work') || lower.includes('office') || lower.includes('stress') || lower.includes('overwhelmed')) {
        return res.json({
          isCrisis: false,
          reply: `Work pressure valla overwhelmed ga feel avvadam common, kani mee sleep mariyu daily life ni affect chesthe serious ga theeskovali. Ippudu oka important task ni matrame select chesi, 5-minute water or breathing break theeskondi. Meeku ekkuva pressure workload valla na, deadline valla na, leka office lo evaraina valla na?`
        });
      }

      if (lower.includes('sleep') || lower.includes('nidra') || lower.includes('tired') || lower.includes('alasata')) {
        return res.json({
          isCrisis: false,
          reply: `Nidra sarigga lekapothe mood mariyu concentration rendu affect avvachu. Evening caffeine tagginchi, room ni quiet ga unchi, padukune mundu konchem calm routine try cheyyandi. Enni gantalu sleep chestunnaru, mariyu anxious thoughts valla nidra disturb avuthondha?`
        });
      }

      if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('worried') || lower.includes('bhayam')) {
        return res.json({
          isCrisis: false,
          reply: `Anxiety valla body lo racing heart, tension, leda restless feeling ravachu. Feet floor pai petti, slow ga breath out cheyyadam try cheyyandi. Ee feeling eppudu start ayindi, mariyu daniki mundu em jarigindi?`
        });
      }

      return res.json({
        isCrisis: false,
        reply: `Meeru cheppina "${latestUserMessage}" ni nenu ardham cheskuntunnanu. Exact ga help cheyyadaniki, idi meeku emotional ga ela affect chesthondi, eppati nundi undi, mariyu ippudu meeku listening kavala leka practical steps kavala cheppandi.`
      });
    }

    if (isHindi) {
      const hindiReply = conversationText.includes('headache') || conversationText.includes('सर दर्द')
        ? `आपने सिरदर्द के बारे में बताया है। इसके कई कारण हो सकते हैं, जैसे पानी की कमी, तनाव, नींद की कमी, स्क्रीन स्ट्रेन या माइग्रेन; चैट से सही कारण की पुष्टि नहीं की जा सकती। यह कब से है, दर्द 1 से 10 में कितना है, और क्या बुखार, उल्टी, धुंधला दिखना, कमजोरी या भ्रम है? अचानक या बहुत तेज सिरदर्द हो तो तुरंत चिकित्सा सहायता लें।`
        : `मैं आपकी बात समझ रहा/रही हूँ: "${latestUserMessage}"। मैं आपको बिना जज किए सुन सकता/सकती हूँ। यह कब से महसूस हो रहा है, और अभी आपको भावनात्मक सहारा चाहिए या किसी व्यावहारिक अगले कदम पर बात करनी है?`;
      return res.json({ isCrisis: false, reply: hindiReply });
    }

    if (isSpanish) {
      const spanishReply = conversationText.includes('headache') || conversationText.includes('dolor de cabeza')
        ? `Entiendo que tienes dolor de cabeza. Puede deberse a deshidratación, estrés, falta de sueño, tensión ocular o migraña; no puedo confirmar la causa por chat. ¿Desde cuándo lo tienes, qué intensidad tiene del 1 al 10 y presentas fiebre, vómitos, cambios en la visión, debilidad o confusión? Si comenzó de forma repentina o es muy intenso, busca atención médica urgente.`
        : `Entiendo lo que compartes: "${latestUserMessage}". Estoy aquí para escucharte con respeto. ¿Desde cuándo te sientes así y prefieres hablar de lo que ocurrió, recibir pasos prácticos o decidir si conviene consultar a un profesional?`;
      return res.json({ isCrisis: false, reply: spanishReply });
    }

    if (isFrench) {
      const frenchReply = conversationText.includes('headache') || conversationText.includes('mal à la tête') || conversationText.includes('mal de tête')
        ? `Je comprends que vous avez mal à la tête. Cela peut être lié à la déshydratation, au stress, au manque de sommeil, à la fatigue visuelle ou à une migraine; je ne peux pas confirmer la cause par chat. Depuis quand avez-vous mal, quelle est l'intensité sur 10 et avez-vous de la fièvre, des vomissements, des troubles de la vision, une faiblesse ou de la confusion? Un début brutal ou une douleur très intense nécessite des soins urgents.`
        : `Je comprends ce que vous partagez: «${latestUserMessage}». Je vous écoute avec bienveillance et sans jugement. Depuis quand vous sentez-vous ainsi, et souhaitez-vous être écouté, recevoir des étapes pratiques ou réfléchir à une consultation professionnelle?`;
      return res.json({ isCrisis: false, reply: frenchReply });
    }

    if (lower.includes('leg pain') || lower.includes('leg ache') || lower.includes('joint pain') || lower.includes('knee pain')) {
      return res.json({ isCrisis: false, reply: `Leg pain can come from muscle strain, overuse, a joint problem, nerve irritation, or an injury, and I cannot confirm the cause from chat alone. Rest from the aggravating activity, keep the leg gently moving, and elevate it if swollen. Did it start after an injury, and is there one-sided swelling, redness, warmth, numbness, weakness, or difficulty walking? Sudden one-leg swelling or pain with chest pain or shortness of breath needs emergency care.` });
    }

    if (lower.includes('headache') || lower.includes('head pain')) {
      return res.json({ isCrisis: false, reply: `Headache may be related to dehydration, stress, poor sleep, eye strain, migraine, or an infection; I cannot confirm the cause from chat alone. Drink fluids, rest from screens, and note the timing and triggers. How long has it lasted, how severe is it from 1 to 10, and do you have fever, vomiting, vision changes, weakness, confusion, or a sudden severe onset? Those warning signs need urgent medical care.` });
    }

    if (lower.includes('burger') || lower.includes('food') || lower.includes('eat') || lower.includes('craving') || lower.includes('hungry') || lower.includes('pizza') || lower.includes('snack')) {
      return res.json({
        isCrisis: false,
        reply: `That sounds like a real food craving. Are you physically hungry, or are you looking for comfort after a difficult or tiring day? If you are hungry, a meal with protein, vegetables, and carbohydrates may keep you satisfied longer. What kind of food feels appealing right now?`
      });
    }

    if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('falling asleep') || lower.includes('tired')) {
      return res.json({
        isCrisis: false,
        reply: `Trouble sleeping can leave both your mood and concentration feeling worse. Tonight, try keeping the room dark and cool, avoid caffeine late in the day, and give yourself a quiet wind-down period before bed. How many hours are you sleeping, and are anxious thoughts or physical symptoms keeping you awake?`
      });
    }

    if (lower.includes('work') || lower.includes('office') || lower.includes('boss') || lower.includes('deadline') || lower.includes('stress') || lower.includes('busy') || lower.includes('overwhelmed')) {
      return res.json({
        isCrisis: false,
        reply: `Feeling overwhelmed by work can affect sleep, concentration, and your body as well as your mood. For the next hour, choose one essential task, break it into a small next step, and take a brief water or breathing break. What is creating the most pressure: the workload, a deadline, a person, or difficulty switching off?`
      });
    }

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic') || lower.includes('worried')) {
      return res.json({
        isCrisis: false,
        reply: `Anxiety can make a situation feel urgent even when you are not in immediate danger. Put both feet on the floor and take a slow breath out that is longer than the breath in; then name the specific worry in one sentence. Are you having physical symptoms such as a racing heart or trouble breathing, and what triggered this feeling?`
      });
    }

    if (lower.includes('sad') || lower.includes('low mood') || lower.includes('exhausted') || lower.includes('lonely') || lower.includes('unmotivated')) {
      return res.json({
        isCrisis: false,
        reply: `Feeling emotionally exhausted or low deserves attention, especially if it is lasting or affecting daily life. For today, focus on one basic need such as food, water, rest, a shower, or contacting someone you trust. How long have you felt this way, and is it affecting your sleep, appetite, work, or relationships?`
      });
    }

    if (previousUserMessages.length > 0 && conversationText !== lower && lower.length < 45) {
      return res.json({
        isCrisis: false,
        reply: `I understand you are asking about "${latestUserMessage}". I can help with practical health guidance, but I cannot confirm a diagnosis from chat. Is this a new symptom, how long has it been happening, and how severe is it from 1 to 10?`
      });
    }

    return res.json({
      isCrisis: false,
      reply: `I’m listening to what you shared: **"${latestUserMessage}"**. I can help you think through the feeling without judging you. What happened just before you started feeling this way, and what do you need most right now: to be heard, to calm your body, or to work out a next step?`
    });

  } catch (err) {
    console.error('API Mental Health Error:', err);
    res.status(500).json({ isCrisis: false, reply: `I hear you. Let's take a deep breath together. What's on your mind right now?` });
  }
});

app.listen(PORT, () => {
  console.log(`VitalCheck AI Backend running on port ${PORT}`);
});
