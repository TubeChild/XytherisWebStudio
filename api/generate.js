module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server' });

  const { type, profile, job, language, text, cvTemplateUrl } = req.body || {};

  let prompt;
  let maxTokens = 1500;

  if (type === 'extract') {
    if (!text) return res.status(400).json({ error: 'Missing text' });
    prompt = `Extract job listing details. Return ONLY valid JSON with keys: company, role, contact_name, contact_email, contact_phone (string or null).\n\n"""${text.slice(0, 7000)}"""`;
    maxTokens = 300;
  } else if (type === 'cv' || type === 'cover_letter') {
    if (!profile || !job) return res.status(400).json({ error: 'Missing profile or job' });

    const we = (profile.work_experiences || [])
      .map(w => `${w.title} — ${w.company} (${w.start_date || '?'} – ${w.end_date || 'nu'})\n${w.description || ''}`)
      .join('\n\n');
    const edu = (profile.education || [])
      .map(e => `${e.degree} — ${e.school} (${e.start_date || '?'} – ${e.end_date || '?'})`)
      .join('\n');
    const skills = (profile.skills || []).join(', ');
    const langWord = language === 'sv' ? 'Swedish' : 'English';

    if (type === 'cv') {
      maxTokens = 4000;
      prompt = `Generate a complete, self-contained HTML document for a professional CV/resume. The document must be fully self-contained (all CSS inline, Google Fonts imported via @import in <style> tag).

DESIGN REQUIREMENTS:
- Background: warm off-white (#FAFAF8)
- Accent color: warm terracotta/dusty rose (#C17B5C) for headings and highlights
- Font: Import "Inter" from Google Fonts (fallback: system sans-serif)
- Layout: Two-column with left sidebar (25%) and right content area (75%)
  * Left: Contact info, photo placeholder (if available), skills tags
  * Right: Name (large, warm), professional summary, work experience, education
- Typography: Warm and professional, NOT cold corporate
- Spacing: Generous whitespace, subtle section dividers
- Print-friendly: Include @media print CSS for A4 page layout, no page breaks in sections
- Contact icons: Use simple unicode symbols (✉ for email, ☎ for phone, 📍 for location, 🔗 for LinkedIn)
- Self-contained: No external dependencies except Google Fonts

CONTENT TO INCLUDE:
Name: ${profile.full_name || 'Name'}
Email: ${profile.email || ''}
Phone: ${profile.phone || ''}
Location: ${profile.address || ''}
LinkedIn: ${profile.linkedin_url || ''}
Summary: ${profile.bio || ''}

Work Experience:
${we || '(none provided)'}

Education:
${edu || '(none provided)'}

Skills: ${skills || '(none provided)'}

Target Position: ${job.role} at ${job.company}

INSTRUCTIONS:
- Generate a complete <html> document with <head>, <style>, and <body>
- Make it visually warm and welcoming while maintaining professionalism
- Tailor the summary and content to the target role
- Ensure it renders beautifully on screen and prints cleanly on A4
- Return ONLY the HTML code, no markdown or explanations`;
    } else {
      const contact = job.contact_name ? `\nAttn: ${job.contact_name}` : '';
      prompt = `Write a professional, tailored cover letter in ${langWord}. Keep it to one page (~300–380 words). Be specific to the role and company. Use a warm but professional tone.

CANDIDATE:
Name: ${profile.full_name || '[Name]'}
Phone: ${profile.phone || ''} | Email: ${profile.email || ''}
LinkedIn: ${profile.linkedin_url || ''}

SUMMARY: ${profile.bio || ''}
EXPERIENCE: ${we || '(none provided)'}
EDUCATION: ${edu || '(none provided)'}
SKILLS: ${skills || '(none provided)'}

TARGET:
Company: ${job.company}${contact}
Role: ${job.role}

Write the complete cover letter now.`;
    }
  } else {
    return res.status(400).json({ error: 'Invalid type. Must be cv, cover_letter, or extract.' });
  }

  try {
    const model = type === 'cv' ? 'claude-opus-4-6' : 'claude-sonnet-4-20250514';
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || `Anthropic HTTP ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json({ content: data.content?.[0]?.text || '' });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
