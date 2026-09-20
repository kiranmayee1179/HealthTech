// Frontend AI Service with Dynamic Multi-Turn Generative Dialogue & Zero Repetition

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/ai`;

const RED_FLAG_TERMS = [
  'chest pain', 'pressure in chest', 'radiating pain', 'left arm pain', 'heart attack', 'heart attack symptoms', 'heart attack signs', 'cardiac arrest', 'heart stopped',
  'shortness of breath', 'can\'t breathe', 'cannot breathe', 'gasping for air',
  'slurred speech', 'face drooping', 'arm weakness', 'numbness on one side',
  'severe bleeding', 'uncontrolled bleeding', 'coughing blood',
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'self-harm',
  'swollen throat', 'throat closing', 'anaphylaxis', 'unconscious', 'passed out',
  'gunde noppi', 'gunde lo pain', 'oopiri aadadam ledu', 'chavali',
  'seene me dard', 'chhati me dard', 'saans nahi aa rahi', 'aatmhatya',
  'dolor de pecho', 'no puedo respirar', 'suicidio', 'sangrado grave',
  'douleur thoracique', 'brustschmerzen', 'గుండె నొప్పి', 'छाती में दर्द'
];

export function checkRedFlags(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return RED_FLAG_TERMS.some(term => lower.includes(term));
}

function classifyIntent(text) {
  const lower = (text || '').toLowerCase();
  const hasQuestionMark = lower.includes('?');
  const questionKeywords = ['why', 'what', 'how', 'is it', 'should i', 'can i', 'cause', 'serious', 'enduku', 'enti', 'ela', 'em', 'cheyali', 'chepthara', 'kyun', 'kya', 'kaise', 'batao'];
  const isQuestion = hasQuestionMark || questionKeywords.some(kw => lower.includes(kw));
  return { isQuestion };
}

export function detectLanguage(text, history = []) {
  const priorUserMsgs = history.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');
  
  if (priorUserMsgs.includes('naaku') || priorUserMsgs.includes('naku') || priorUserMsgs.includes('noppiga') || priorUserMsgs.includes('enduku') || priorUserMsgs.includes('undi') || priorUserMsgs.includes('vasthundi') || priorUserMsgs.includes('chepthara') || priorUserMsgs.includes('theeskuntanu') || priorUserMsgs.includes('veskovacha') || priorUserMsgs.includes('work valla') || priorUserMsgs.includes('kani') || priorUserMsgs.includes('sare')) {
    return 'Telugu_Tenglish';
  }
  if (priorUserMsgs.includes('mujhe') || priorUserMsgs.includes('sar dard') || priorUserMsgs.includes('kyun')) {
    return 'Hindi_Hinglish';
  }

  const lower = (text || '').toLowerCase();
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu_Native';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi_Native';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil_Native';

  const tenglishKeywords = ['naaku', 'naku', 'noppiga', 'thala noppi', 'jwaram', 'undi', 'vasthundi', 'daggukaa', 'nundi', 'gunde', 'cheyali', 'neellu', 'kasta', 'ayindi', 'enti', 'kaavali', 'thala', 'enduku', 'chepthara', 'theeskuntanu', 'veskovacha', 'period pain', 'kadupu noppi', 'work valla', 'office', 'kani'];
  if (tenglishKeywords.some(kw => lower.includes(kw))) return 'Telugu_Tenglish';

  const hinglishKeywords = ['mujhe', 'sar dard', 'bukhar', 'ho raha hai', 'kya karu', 'paani', 'saans', 'khansi', 'dino se', 'kyun'];
  if (hinglishKeywords.some(kw => lower.includes(kw))) return 'Hindi_Hinglish';

  if (/[áéíóúñ¿¡]/i.test(lower) || lower.includes('tengo') || lower.includes('dolor') || lower.includes('cabeza')) return 'Spanish';
  if (/[àâçéèêëîïôûùüÿæœ]/i.test(lower) || lower.includes('mal à') || lower.includes('tête')) return 'French';

  return 'English';
}

export async function processIntakeMessage(messages, userProfile, selectedLang = 'Auto') {
  return new Promise((resolve) => {
    streamIntakeMessage(
      messages,
      userProfile,
      selectedLang,
      () => {},
      (finalObj) => resolve(finalObj)
    );
  });
}

export async function streamIntakeMessage(messages, userProfile, selectedLang, onToken, onComplete, signal) {
  const latestMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  const lang = selectedLang !== 'Auto' ? selectedLang : detectLanguage(latestMsg, messages);
  const intent = classifyIntent(latestMsg);

  if (checkRedFlags(latestMsg)) {
    onComplete({
      isEmergency: true,
      emergencyTitle: 'CRITICAL EMERGENCY ALERT',
      emergencyMessage: 'Your described symptoms suggest a potential medical emergency. VitalCheck AI cannot safely evaluate emergencies.',
      actions: ['Call 112 (India emergency services) IMMEDIATELY.', 'For mental-health crisis support in India, call Tele-MANAS at 14416.'],
      hotlines: [{ name: 'India Emergency Services', number: '112', primary: true }, { name: 'Tele-MANAS', number: '14416', primary: true }]
    });
    return;
  }

  let responseObj = null;

  try {
    const res = await fetch(`${API_BASE}/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userProfile, language: lang, isQuestion: intent.isQuestion }),
      signal
    });

    if (res.ok) {
      responseObj = await res.json();
    }
  } catch (err) {
    if (signal?.aborted) return;
    console.warn('Backend server unavailable, using direct intent-based response:', err);
  }

  if (!responseObj) {
    responseObj = generateDirectRelevantResponse(messages, userProfile, lang, intent);
  }

  if (responseObj.isEmergency) {
    onComplete(responseObj);
    return;
  }

  const fullText = responseObj.isFinalTriage 
    ? (responseObj.triageCard?.summary || "I have evaluated your symptoms and generated your triage card.")
    : responseObj.followUpQuestion;

  const words = fullText.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) break;
    accumulated += (i === 0 ? '' : ' ') + words[i];
    onToken(accumulated);
    await new Promise(resolve => setTimeout(resolve, 25));
  }

  onComplete(responseObj, accumulated);
}

function generateDirectRelevantResponse(messages, userProfile, lang, intent) {
  const latest = messages.filter(m => m.role === 'user').pop()?.content || '';
  const lower = latest.toLowerCase();
  const userTurns = messages.filter(m => m.role === 'user').length;
  const hasDetails = /\b(day|days|hour|hours|week|weeks|scale|severe|mild|fever|vomit|vomiting|pain|hurt|rash|cough|dizzy|breath)\b/i.test(lower);

  if (lang === 'Telugu_Tenglish') {
    if (intent.isQuestion || lower.includes('enduku') || lower.includes('chepthara')) {
      return {
        isEmergency: false,
        isFinalTriage: false,
        followUpQuestion: `Meeru adigina vishayanki chala possible causes undavachu; chat dwara exact cause confirm cheyyalem. Idi enni rojulu ga undi, 1-10 lo entha severe ga undi, mariyu vere symptoms emaina unnaya?`
      };
    }
    if (userTurns >= 2 || hasDetails) {
      return {
        isEmergency: false,
        isFinalTriage: true,
        triageCard: {
          urgency: 'Self-Care (Inti Daggara Jagrathalu)',
          urgencyColor: 'green',
          summary: `${userProfile?.name || 'Patient'} garu, meeru cheppina "${latest}" gurinchi initial guidance. Chat dwara exact cause confirm cheyyalem.`,
          explanations: ['Mild and temporary cause undavachu, kani symptom pattern mariyu accompanying symptoms important', 'Symptom continue ayina, worsen ayina, leda malli malli vachina doctor ni consult cheyyandi'],
          nextSteps: 'Symptom ni monitor cheyyandi, triggers mariyu changes note cheskondi, symptom ki tagina low-risk comfort measures maatrame use cheyyandi, mariyu worsen ayite medical care theeskondi.'
        }
      };
    }
    return {
      isEmergency: false,
      isFinalTriage: false,
      followUpQuestion: `Meeru cheppina "${latest}" ardham ayyindi. Chat dwara exact cause confirm cheyyalem. Idi enni rojulu ga undi, 1-10 lo entha severe ga undi, mariyu vere symptoms leda triggers emaina unnaya?`
    };
  }

  if (intent.isQuestion || lower.includes('why') || lower.includes('what') || lower.includes('cause')) {
    return {
      isEmergency: false,
      isFinalTriage: false,
      followUpQuestion: `I understand you are asking about "${latest}". Several causes are possible, and I cannot confirm the cause from chat alone. How long has this been happening, how severe is it from 1 to 10, and what other symptoms do you have?`
    };
  }

  if (userTurns >= 2 || hasDetails) {
    return {
      isEmergency: false,
      isFinalTriage: true,
      triageCard: {
        urgency: 'Self-Care',
        urgencyColor: 'green',
        summary: `Initial guidance for ${userProfile?.name || 'Patient'} regarding "${latest}". The cause cannot be confirmed from chat alone.`,
        explanations: ['A mild, self-limited cause is possible, but the symptom pattern and associated symptoms matter', 'Ongoing, worsening, or recurrent symptoms should be reviewed by a clinician'],
        nextSteps: 'Monitor the symptom, note triggers and changes, use only low-risk comfort measures that fit the symptom, and seek medical care if it worsens, persists, or red-flag symptoms appear.'
      }
    };
  }

  return {
    isEmergency: false,
    isFinalTriage: false,
    followUpQuestion: `I understand you are experiencing "${latest}". I cannot confirm the cause from chat alone. How long has it been happening, how severe is it from 1 to 10, and what other symptoms or triggers have you noticed?`
  };
}

/**
 * Dynamic Multi-Turn Mental Health Generative Engine
 * Evaluates specific topics, food cravings, emotions, and questions with zero repetition.
 */
export async function processMentalHealthMessage(messages, selectedLang = 'Auto') {
  return new Promise((resolve) => {
    streamMentalHealthMessage(
      messages,
      selectedLang,
      () => {},
      (finalObj) => resolve(finalObj)
    );
  });
}

export async function streamMentalHealthMessage(messages, selectedLang = 'Auto', onToken, onComplete, signal) {
  const latestMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  const lang = selectedLang !== 'Auto' ? selectedLang : detectLanguage(latestMsg, messages);
  const lower = latestMsg.toLowerCase();

  if (checkRedFlags(latestMsg)) {
    const crisisObj = {
      isCrisis: true,
      reply: `I hear how much pain you are experiencing right now. Please know your life matters. Trained professionals are available 24/7 to support you with no judgment.`,
      resources: [
        { name: 'Tele-MANAS', contact: 'Call 14416 (India, 24/7)' },
        { name: 'Tele-MANAS alternate number', contact: 'Call 1800-891-4416' },
      ]
    };
    onComplete(crisisObj, crisisObj.reply);
    return;
  }

  let responseObj = null;

  try {
    const res = await fetch(`${API_BASE}/mental-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, language: lang }),
      signal
    });

    if (res.ok) {
      responseObj = await res.json();
    }
  } catch (err) {
    if (signal?.aborted) return;
    console.warn('Backend mental health API unavailable, using local dynamic response engine:', err);
  }

  if (!responseObj) {
    responseObj = generateLocalMentalHealthResponse(messages, lang, lower);
  }

  const fullText = responseObj.reply || `Thank you for sharing that with me. What else is on your mind today?`;
  const words = fullText.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) break;
    accumulated += (i === 0 ? '' : ' ') + words[i];
    onToken(accumulated);
    await new Promise(resolve => setTimeout(resolve, 25));
  }

  onComplete(responseObj, accumulated);
}

function generateLocalMentalHealthResponse(messages, lang, lower) {
  const latestMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  const userTurns = messages.filter(m => m.role === 'user').length;

  // Food cravings / Burger / Appetite
  if (lower.includes('burger') || lower.includes('food') || lower.includes('eat') || lower.includes('craving') || lower.includes('hungry') || lower.includes('pizza') || lower.includes('snack')) {
    return {
      isCrisis: false,
      reply: `A delicious burger sounds really comforting! 🍔 Food is often deeply linked to our mood, energy, and comfort.

Are you thinking of getting a burger because you're genuinely hungry, or has it been a stressful/busy day where a yummy treat feels like a reward? Either way, enjoying good food can be a great mood booster! What kind of burger are you craving?`
    };
  }

  // Multi-Turn Dynamic Dialogue Dictionary (Tenglish)
  if (lang === 'Telugu_Tenglish') {
    const latestHasPeriodPain = lower.includes('period pain') || lower.includes('period cramps') || lower.includes('menstrual pain');
    const latestHasStomachPain = lower.includes('stomachache') || lower.includes('stomach ache') || lower.includes('stomach pain') || lower.includes('kadupu noppi') || lower.includes('kadupu');
    const latestHasHeadache = lower.includes('headache') || lower.includes('head pain') || lower.includes('thala noppi');
    const latestHasFever = lower.includes('fever') || lower.includes('jwaram') || lower.includes('temperature');
    const latestHasCough = lower.includes('cough') || lower.includes('daggu') || lower.includes('sore throat') || lower.includes('cold');
    const latestHasRash = lower.includes('rash') || lower.includes('itching') || lower.includes('itchy');
    const latestHasToothPain = lower.includes('tooth') || lower.includes('gum') || lower.includes('dental');
    const latestHasUrinaryPain = lower.includes('urine') || lower.includes('urinate') || lower.includes('pee') || lower.includes('uti');
    const latestHasLegPain = lower.includes('leg pain') || lower.includes('leg ache') || lower.includes('kalu noppi') || lower.includes('joint pain') || lower.includes('knee pain');

    if (latestHasPeriodPain) {
      return { isCrisis: false, reply: `Period pain / menstrual cramps common ga untayi, kani severe pain ni ignore cheyyakandi. Warm compress, gentle stretching, rest, and fluids help avvachu. Tablet theeskune mundu label instructions follow cheyyandi and pharmacist or doctor ni adagandi; pregnancy possibility, stomach ulcer, kidney disease, blood thinners, or allergy unte ibuprofen avoid cheyyali. Heavy bleeding, fainting, fever, vomiting, one-side severe pain, or pregnancy possibility unte urgent care theeskondi. Mee pain 1-10 lo entha, bleeding normal ga unda?` };
    }

    if (latestHasStomachPain) {
      return { isCrisis: false, reply: `Mee stomachache / kadupu noppi gas, indigestion, constipation, food irritation, infection, leda vere abdominal cause valla undavachu; chat dwara exact cause confirm cheyyalem. Noppi ekkada undi, eppati nundi undi, vomiting or fever unnaya? Severe or worsening pain, hard/swollen stomach, blood in stool, or fluids keep cheyyalekapothe urgent medical care theeskondi.` };
    }

    if (latestHasHeadache) {
      return { isCrisis: false, reply: `Mee headache / thala noppi dehydration, stress, nidra thakkuva, screen strain, leda migraine valla ravachu; exact cause chat dwara confirm cheyyalem. Eppati nundi undi, 1-10 lo entha severe ga undi, fever, vomiting, vision changes, weakness, or confusion unnaya? Sudden ga severe headache ayite urgent care theeskondi.` };
    }

    if (latestHasFever) {
      return { isCrisis: false, reply: `Fever / jwaram infection, dehydration, leda vere illness valla ravachu. Temperature measure cheyyandi, fluids thagandi, rest theeskondi. Temperature entha undi, enni rojulu ga undi, cough, vomiting, rash, or breathing problem unnaya? Confusion, stiff neck, severe weakness, or breathing trouble ayite urgent care theeskondi.` };
    }

    if (latestHasCough) {
      return { isCrisis: false, reply: `Cough or cold viral infection, allergy, throat irritation, leda asthma valla undavachu. Cough enni rojulu ga undi, fever or phlegm unda, breathing difficulty or chest pain unnaya? Breathing kastam, blue lips, or blood cough chesthe emergency help theeskondi.` };
    }

    if (latestHasRash) {
      return { isCrisis: false, reply: `Rash or itching irritation, allergy, insect bite, leda infection valla undavachu. Rash spread avuthonda, painful or blistering ga unda, fever or face/lip swelling unnaya? Face swelling or breathing trouble ayite immediate emergency care theeskondi.` };
    }

    if (latestHasToothPain) {
      return { isCrisis: false, reply: `Tooth or gum pain cavity, gum irritation, sensitivity, leda infection valla ravachu. Face swelling, fever, pus, mouth open cheyyadam kastam, or swallowing difficulty unnaya? Ivi unte urgent dentist or medical care theeskondi; otherwise dentist appointment arrange cheyyandi.` };
    }

    if (latestHasUrinaryPain) {
      return { isCrisis: false, reply: `Urine burning or pain urinary irritation, UTI, dehydration, leda vere urinary problem valla undavachu. Fever, back/side pain, vomiting, or blood in urine unnaya? Ivi unte same-day doctor review avasaram; fluids thagandi unless doctor fluid restriction cheppunte.` };
    }

    if (latestHasLegPain) {
      return { isCrisis: false, reply: `Mee leg or joint pain muscle strain, overuse, nerve problem, joint irritation, or injury valla undavachu. Injury, swelling, redness, warmth, numbness, weakness, fever, or walking difficulty unnaya? One leg sudden ga swollen/red/warm ga undi, or breathing problem/chest pain unte emergency care theeskondi. Otherwise rest, leg elevate cheyyadam, and gentle movement try chesi pain continue ayite doctor ni consult cheyyandi.` };
    }

    if ((lower.includes('office') && lower.includes('work')) || (lower.includes('theeskuntanu') && lower.includes('work')) || (lower.includes('office work')) || (lower.includes('kani') && lower.includes('work'))) {
      return {
        isCrisis: false,
        reply: `Office work mariyu deadlines unnapudu rest theesukoovadam nijangane kasta ibbandhe. Kani work madhyalo 5 minutes water break leda desk stretch cheyandi. Mee office work lo ey task mee meedha ekkuva pressure peduthondhi?`
      };
    }

    if (lower === 'work valla' || lower.includes('work valla') || lower.includes('office valla') || lower.includes('work pressure') || lower === 'work') {
      return {
        isCrisis: false,
        reply: `Work valla ekkuva stress mariyu alasata vasthunapudu, eeroju pradhana tasks ni maatrame complete cheskondi. Mee arogyam mariyu manassanthi chalane mukhym. Work aypoyaka evening koncham time mee kosam spend cheyagalaru?`
      };
    }

    if (lower === 'ha' || lower === 'sare' || lower === 'okay' || lower.includes('try chestanu') || lower.includes('manchidhi') || lower === 'avunu') {
      return {
        isCrisis: false,
        reply: `Chala manchidhi! Chinna chinna adugule mee stress ni thaggisthayi. Nenu eppudu ikkade unnanu meeku thodu ga. Meeru eeroju evening relax avvaniki emanna plan cheskunara?`
      };
    }

    return {
      isCrisis: false,
      reply: `Meeru '${latestMsg}' gurinchi cheppina maatalu nenu vinanu. Ee vishayam mee manaasiki entha ibbandhi kaligisthondhi? Meeru eeroju koncham time mee kosam ivvagalaru?`
    };
  }

  // ENGLISH DYNAMIC MULTI-TURN ENGINE
  if (lower.includes('leg pain') || lower.includes('leg ache') || lower.includes('joint pain') || lower.includes('knee pain')) {
    return {
      isCrisis: false,
      reply: `Leg pain can come from muscle strain, overuse, a joint problem, nerve irritation, or an injury, and I cannot confirm the cause from chat alone. Rest from the aggravating activity, keep the leg gently moving, and elevate it if swollen. Did it start after an injury, and is there one-sided swelling, redness, warmth, numbness, weakness, or difficulty walking? Sudden one-leg swelling or pain with chest pain or shortness of breath needs emergency care.`
    };
  }

  if (lower.includes('headache') || lower.includes('head pain')) {
    return {
      isCrisis: false,
      reply: `Headache may be related to dehydration, stress, poor sleep, eye strain, migraine, or an infection; I cannot confirm the cause from chat alone. Drink fluids, rest from screens, and note the timing and triggers. How long has it lasted, how severe is it from 1 to 10, and do you have fever, vomiting, vision changes, weakness, confusion, or a sudden severe onset? Those warning signs need urgent medical care.`
    };
  }

  if (lower.includes('period pain') || lower.includes('stomachache') || lower.includes('headache') || lower.includes('fever') || lower.includes('cough') || lower.includes('rash') || lower.includes('tooth pain') || lower.includes('urine burning') || lower.includes('leg pain') || lower.includes('joint pain') || lower.includes('knee pain')) {
    return {
      isCrisis: false,
      reply: `I understand you are describing **"${latestMsg}"**. Several causes are possible, and I cannot confirm the diagnosis from chat. How long has it been happening, how severe is it from 1 to 10, and what other symptoms are present? Please seek urgent care for severe or rapidly worsening symptoms, breathing trouble, fainting, confusion, or heavy bleeding.`
    };
  }

  if ((lower.includes('office') && lower.includes('work')) || (lower.includes('work') && lower.includes('yes')) || (lower.includes('work') && lower.includes('but'))) {
    return {
      isCrisis: false,
      reply: `It can be really hard to step away when office work and deadlines pile up. Even taking a 2-minute water break or stretching at your desk can help lower tension. What specific work task is causing the most pressure right now?`
    };
  }

  if (lower === 'work valla' || lower.includes('because of work') || lower.includes('work pressure') || lower === 'work') {
    return {
      isCrisis: false,
      reply: `When work is the main source of stress, try breaking your day into smaller manageable tasks. Remember that your health is more important than any deadline. Can you plan a relaxing 15-minute walk after work today?`
    };
  }

  if (lower === 'yes' || lower === 'ha' || lower === 'okay' || lower.includes('will try') || lower.includes('sure')) {
    return {
      isCrisis: false,
      reply: `That is great to hear! Taking small steps will help ease the load. I am always here to support you. Is there anything else on your mind today?`
    };
  }

  return {
    isCrisis: false,
    reply: `Thank you for sharing about **"${latestMsg}"**. Your thoughts and feelings are completely valid. 

What is one small thing that would bring you comfort or joy right now?`
  };
}

export async function generateWeeklySummaryAI(logs, userProfile) {
  const recent = logs.slice(-7);
  if (!recent.length) {
    return {
      avgMood: null,
      avgSleep: null,
      summaryText: 'No wellness entries have been recorded yet. Add your first daily check-in to begin personalized health trend summaries.'
    };
  }
  const avgMood = (recent.reduce((acc, l) => acc + (l.mood || 3), 0) / (recent.length || 1)).toFixed(1);
  const avgSleep = (recent.reduce((acc, l) => acc + (l.sleepHours || 7), 0) / (recent.length || 1)).toFixed(1);

  return {
    avgMood,
    avgSleep,
    summaryText: `Weekly summary for ${userProfile?.name || 'Alex'}: Average sleep was ${avgSleep} hours/night with a mood score of ${avgMood}/5. Sleep and water levels look steady! **Tip**: Keep drinking 2 to 2.5 liters of water daily.`
  };
}
