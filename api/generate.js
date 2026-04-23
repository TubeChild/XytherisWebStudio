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

    let templateNote = '';
    if (cvTemplateUrl) {
      try {
        const tr = await fetch(cvTemplateUrl, { signal: AbortSignal.timeout(5000) });
        const ct = tr.headers.get('content-type') || '';
        if (ct.includes('text/plain')) {
          const tmpl = await tr.text();
          if (tmpl && tmpl.length > 50) {
            templateNote = `\n\nEXISTING CV TEMPLATE (maintain this structure and style):\n${tmpl.slice(0, 2000)}`;
          }
        } else {
          templateNote = '\n\nNote: The user has an existing CV template — please generate a document that follows a similar professional structure and style.';
        }
      } catch (_) {}
    }

    if (type === 'cv') {
      prompt = `Generate a professional, tailored CV in ${langWord} for the following candidate applying to the specified position. Format it as plain text with clear section headers (no markdown symbols). Make it ATS-friendly and tailored to the role.${templateNote}

CANDIDATE:
Name: ${profile.full_name || '[Name]'}
Phone: ${profile.phone || ''}
Email: ${profile.email || ''}
Address: ${profile.address || ''}
LinkedIn: ${profile.linkedin_url || ''}

SUMMARY:
${profile.bio || ''}

WORK EXPERIENCE:
${we || '(none provided)'}

EDUCATION:
${edu || '(none provided)'}

SKILLS: ${skills || '(none provided)'}

TARGET ROLE: ${job.role} at ${job.company}

Write the complete CV now.`;
    } else {
      const contact = job.contact_name ? `\nAttn: ${job.contact_name}` : '';
      prompt = `Write a professional, tailored cover letter in ${langWord}. Keep it to one page (~300–380 words). Be specific to the role and company. Use a warm but professional tone.${templateNote}

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
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
