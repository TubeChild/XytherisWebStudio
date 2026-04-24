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
      .map(e => `${e.degree} — ${e.school} (${e.start_date || '?'} – ${e.end_date || '?'})${e.description ? `\n${e.description}` : ''}`)
      .join('\n\n');
    const skills = (profile.skills || []).join(', ');
    const languages = (profile.languages || [])
      .filter(l => l.name)
      .map(l => `${l.name} — ${l.level || ''}`)
      .join('\n');
    const courses = (profile.courses || [])
      .filter(c => c.name)
      .map(c => `${c.name} — ${c.issuer || ''} (${c.date || ''})${c.description ? `\n${c.description}` : ''}`)
      .join('\n\n');
    const driverLicense = profile.driver_license
      ? `Yes — Type: ${profile.driver_license_type || 'Not specified'}`
      : '';
    let referencesSection;
    if (profile.references_on_request) {
      referencesSection = 'REFERENCES_ON_REQUEST';
    } else if ((profile.reference_list || []).filter(r => r.name).length > 0) {
      referencesSection = (profile.reference_list || [])
        .filter(r => r.name)
        .map(r => `${r.name}${r.title ? `, ${r.title}` : ''}${r.company ? `, ${r.company}` : ''}${r.email ? ` — ${r.email}` : ''}${r.phone ? ` — ${r.phone}` : ''}`)
        .join('\n');
    } else {
      referencesSection = '';
    }
    const langWord = language === 'sv' ? 'Swedish' : 'English';
    const refLabel = language === 'sv' ? 'Referenser lämnas på begäran' : 'References available on request';

    if (type === 'cv') {
      maxTokens = 2000;
      const refsText = referencesSection === 'REFERENCES_ON_REQUEST' ? refLabel : referencesSection;
      prompt = `You are generating CV content. Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

CANDIDATE DATA (use exactly as given — do NOT invent or add qualifications):
Name: ${profile.full_name || ''}
Email: ${profile.email || ''}
Phone: ${profile.phone || ''}
Location: ${profile.address || ''}
LinkedIn: ${profile.linkedin_url || ''}
Summary: ${profile.bio || ''}
Skills: ${skills || ''}
Languages: ${languages || ''}
Driver license: ${driverLicense || ''}
Courses: ${courses || ''}
References: ${refsText || ''}

Work experience:
${we || '(none)'}

Education:
${edu || '(none)'}

TARGET POSITION (the job being applied for — NOT an existing credential):
Role: ${job.role}
Company: ${job.company}

Return this exact JSON structure (all fields required, use empty string or empty array if no data):
{
  "name": "full name",
  "title": "candidate's actual professional title/credential — NEVER the target role",
  "applying_for": "${job.role} — ${job.company}",
  "summary": "professional summary tailored to the role in ${langWord} — do not invent credentials",
  "contact": {
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": ""
  },
  "skills": ["skill1", "skill2"],
  "languages": [{"name": "...", "level": "..."}],
  "license": "license type or empty string",
  "experiences": [
    {"title": "", "company": "", "location": "", "dates": "", "description": ""}
  ],
  "education": [
    {"degree": "", "school": "", "dates": "", "description": ""}
  ],
  "courses": [
    {"name": "", "issuer": "", "date": "", "description": ""}
  ],
  "references_text": "references note or empty string"
}

RULES:
- Include EVERY work experience and education entry — do not drop or summarize any.
- The "title" field must reflect the candidate's ACTUAL credentials, never the target role.
- Write "summary" in ${langWord}.
- Return ONLY the JSON object. Nothing else.`;
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
    const model = 'claude-sonnet-4-20250514';
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
    let content = data.content?.[0]?.text || '';
    if (type === 'cv') {
      content = content.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
      const htmlStart = content.indexOf('<!DOCTYPE');
      const htmlStart2 = content.indexOf('<html');
      const start = htmlStart >= 0 ? htmlStart : htmlStart2;
      if (start > 0) content = content.slice(start);
    }
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
