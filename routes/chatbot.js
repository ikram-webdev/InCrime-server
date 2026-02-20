const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Legal knowledge base for AI responses
const legalKnowledge = {
  bail: 'A bail application is a legal request to release an accused person from custody. Pre-arrest bail (anticipatory bail) is filed before arrest to prevent it. Post-arrest bail is filed after arrest. You need to provide case details, FIR number, sections charged, and reasons why bail should be granted.',
  theft: 'For theft complaints, you need: the date and place of incident, description of stolen items with values, witnesses (if any), FIR number if already filed, and personal identification. The complaint should be filed at the local police station first.',
  harassment: 'Harassment applications require: description of incidents with dates, names of harassers if known, witnesses, any evidence (messages, photos), and the nature of harassment (physical, mental, digital). You can file under PPRA or PPC Section 509.',
  nikah: 'Nikah Nama is the official marriage certificate in Pakistan. It requires: full names of bride and groom, CNIC numbers, Wali (guardian) details, Mehr (dower) amount, witnesses, and Nikah Registrar signature. It must be registered with Union Council.',
  custody: 'Child custody in Pakistan is governed by Guardians and Wards Act 1890. Mother gets custody of young children (sons up to 7, daughters until puberty). For custody applications, provide: childs age and details, financial stability proof, living conditions description.',
  challan: 'A challan is a police charge sheet filed in court. Challan applications involve requesting court action regarding traffic challans or police charge sheets. Provide case number, challan date, violation details, and grounds for your application.',
  darulaman: 'Dar-ul-Aman is a shelter home for women in distress. Applications related to Dar-ul-Aman include: sending a woman for protection (under court order), requesting a meeting with someone in Dar-ul-Aman (requires court permission), or release from Dar-ul-Aman.',
  divorce: 'In Pakistan, divorce can be: Talaq (by husband), Khula (by wife with court), or Judicial divorce (court). Talaq must be registered with Union Council. For Khula, file petition in Family Court with grounds like cruelty, non-maintenance, or irreconcilable differences.',
  default: 'I am InCrime AI Assistant, specialized in Pakistani legal matters. I can help you with: bail applications, theft complaints, harassment cases, family law (nikah, custody, divorce), and document generation. Please describe your legal issue and I will guide you.',
};

function generateLegalResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes('bail') || msg.includes('arrest') || msg.includes('ضمانت')) {
    return legalKnowledge.bail;
  } else if (msg.includes('theft') || msg.includes('stolen') || msg.includes('چوری') || msg.includes('rob')) {
    return legalKnowledge.theft;
  } else if (msg.includes('harass') || msg.includes('abuse') || msg.includes('harassment')) {
    return legalKnowledge.harassment;
  } else if (msg.includes('nikah') || msg.includes('marriage') || msg.includes('nikah nama') || msg.includes('نکاح')) {
    return legalKnowledge.nikah;
  } else if (msg.includes('custody') || msg.includes('child') || msg.includes('guardian')) {
    return legalKnowledge.custody;
  } else if (msg.includes('challan') || msg.includes('charge sheet')) {
    return legalKnowledge.challan;
  } else if (msg.includes('darul') || msg.includes('shelter') || msg.includes('darulaman')) {
    return legalKnowledge.darulaman;
  } else if (msg.includes('divorce') || msg.includes('talaq') || msg.includes('khula') || msg.includes('طلاق')) {
    return legalKnowledge.divorce;
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('help') || msg.includes('السلام')) {
    return 'السلام علیکم! Welcome to InCrime Legal Assistant. I can help you with Pakistani legal matters including bail applications, FIR drafting, family law cases, and legal document generation. What is your legal query today?';
  } else if (msg.includes('fir') || msg.includes('police') || msg.includes('report')) {
    return 'For filing an FIR (First Information Report): Go to your local police station, describe the incident, provide evidence if available. If police refuse to register FIR, you can approach the DSP or file a petition in court under Section 22-A CrPC. InCrime can help you draft related applications.';
  } else if (msg.includes('document') || msg.includes('template') || msg.includes('application')) {
    return 'InCrime provides legal document templates for: Criminal Cases (Bail Pre/Post, Theft, Harassment, Challan, Consent, Attendance Excused) and Family Cases (Nikah Nama, Child Custody, Tansikh Nikah, Second Marriage, Dar-ul-Aman applications). Click "Create Application" in the menu to get started.';
  } else {
    return legalKnowledge.default + '\n\nFor your specific query about "' + userMessage.slice(0, 50) + '...", please consult with a licensed advocate for professional legal advice.';
  }
}

// @route   POST /api/chatbot/message
// @desc    Send message to chatbot
// @access  Private
router.post('/message', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Simulate processing time
    const response = generateLegalResponse(message.trim());

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Chatbot error' });
  }
});

module.exports = router;
