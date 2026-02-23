const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// ─── Claude API Integration ────────────────────────────────────────────────────
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'; // Fast & cost-effective

const SYSTEM_PROMPT = `You are InCrime AI, a specialized legal assistant for Pakistani law and legal matters. 

Your expertise includes:
- Bail applications (pre-arrest and post-arrest)
- FIR (First Information Report) filing and drafting
- Family law: Nikah Nama, child custody, divorce (Talaq, Khula), second marriage
- Dar-ul-Aman (shelter homes) applications
- Harassment and abuse cases under PPRA and PPC
- Theft and criminal complaint procedures
- Challan (charge sheet) applications
- Legal document templates and guidance

Guidelines:
- Always respond in clear, simple language that non-lawyers can understand
- Provide step-by-step guidance when asked about procedures
- Reference relevant Pakistani laws (PPC, CrPC, Family Courts Act, etc.) when helpful
- If someone asks in Urdu, respond in Urdu
- Always end serious legal queries with: "For your specific case, consulting a licensed advocate is strongly recommended."
- Never provide advice that could be harmful or illegal
- Be empathetic — users may be in distressing situations

You are here to help citizens understand their legal rights and options in Pakistan.`;

async function callClaudeAPI(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API error');
  }

  const data = await response.json();
  return data.content[0]?.text || 'I apologize, I could not generate a response.';
}

// ─── Fallback: keyword-based responses if Claude API key not set ───────────────
const legalKnowledge = {
  bail: 'A bail application is a legal request to release an accused person from custody. Pre-arrest bail (anticipatory bail) is filed before arrest. Post-arrest bail is filed after arrest. You need: case details, FIR number, sections charged, and reasons bail should be granted.',
  theft: 'For theft complaints you need: date and place of incident, description of stolen items with values, witnesses (if any), FIR number if filed, and personal identification. File the complaint at the local police station first.',
  harassment: 'Harassment applications require: description of incidents with dates, names of harassers if known, witnesses, evidence (messages, photos), and the nature of harassment. You can file under PPRA or PPC Section 509.',
  nikah: 'Nikah Nama is the official marriage certificate in Pakistan. It requires: full names of bride and groom, CNIC numbers, Wali (guardian) details, Mehr amount, witnesses, and Nikah Registrar signature. Must be registered with Union Council.',
  custody: 'Child custody in Pakistan is governed by Guardians and Wards Act 1890. Mother gets custody of young children (sons up to 7, daughters until puberty). For custody applications, provide: child\'s age and details, financial stability proof, living conditions description.',
  darulaman: 'Dar-ul-Aman is a shelter home for women in distress. Applications include: sending a woman for protection (under court order), requesting a meeting (requires court permission), or release from Dar-ul-Aman.',
  divorce: 'In Pakistan, divorce can be: Talaq (by husband), Khula (by wife with court), or Judicial divorce (court). Talaq must be registered with Union Council. For Khula, file petition in Family Court with grounds like cruelty, non-maintenance, or irreconcilable differences.',
  default: 'I am InCrime AI Assistant, specialized in Pakistani legal matters. I can help you with: bail applications, FIR drafting, family law (nikah, custody, divorce), harassment cases, and document generation. Please describe your legal issue.',
};

function fallbackResponse(userMessage) {
  const msg = userMessage.toLowerCase();
  if (msg.includes('bail') || msg.includes('arrest') || msg.includes('ضمانت')) return legalKnowledge.bail;
  if (msg.includes('theft') || msg.includes('stolen') || msg.includes('چوری') || msg.includes('rob')) return legalKnowledge.theft;
  if (msg.includes('harass') || msg.includes('abuse')) return legalKnowledge.harassment;
  if (msg.includes('nikah') || msg.includes('marriage') || msg.includes('نکاح')) return legalKnowledge.nikah;
  if (msg.includes('custody') || msg.includes('child') || msg.includes('guardian')) return legalKnowledge.custody;
  if (msg.includes('darul') || msg.includes('shelter') || msg.includes('darulaman')) return legalKnowledge.darulaman;
  if (msg.includes('divorce') || msg.includes('talaq') || msg.includes('khula') || msg.includes('طلاق')) return legalKnowledge.divorce;
  if (msg.includes('fir') || msg.includes('police') || msg.includes('report')) return 'For filing an FIR: Go to your local police station, describe the incident, provide evidence if available. If police refuse to register FIR, you can approach the DSP or file a petition in court under Section 22-A CrPC.';
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('السلام')) return 'السلام علیکم! Welcome to InCrime Legal Assistant. I can help you with Pakistani legal matters. What is your legal query today?';
  return legalKnowledge.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/chatbot/message
// @desc    Send message to AI chatbot (Claude API with keyword fallback)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/message', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let response;

    // ✅ Use Claude API if key is configured, otherwise use fallback
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        // Convert history format: [{role, text}] → [{role, content}]
        const formattedHistory = history
          .slice(-10) // Keep last 10 messages for context window
          .map(msg => ({ role: msg.role === 'bot' ? 'assistant' : 'user', content: msg.text }));

        response = await callClaudeAPI(message.trim(), formattedHistory);
      } catch (apiError) {
        console.error('Claude API error, using fallback:', apiError.message);
        response = fallbackResponse(message.trim());
      }
    } else {
      // No API key configured — use keyword-based fallback
      console.warn('ANTHROPIC_API_KEY not set. Using keyword fallback.');
      response = fallbackResponse(message.trim());
    }

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ success: false, message: 'Chatbot error. Please try again.' });
  }
});

module.exports = router;
