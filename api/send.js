import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_ORIGINS = [
  'https://kreativlabor-egn.vercel.app',
  'http://localhost:3000',
];

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function sanitizeString(str, maxLength) {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLength).replace(/[\r\n]/g, ' ');
}

function sanitizeFileName(name) {
  if (typeof name !== 'string') return 'attachment';
  return name.replace(/[/\\:*?"<>|]/g, '_').slice(0, 255);
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { subject, nachricht, replyTo, fileName, fileData } = req.body;

    if (!subject || !nachricht) {
      return res.status(400).json({ error: 'Betreff und Nachricht sind erforderlich.' });
    }
    if (replyTo && !isValidEmail(replyTo)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
    }
    if (fileName && typeof fileData !== 'string') {
      return res.status(400).json({ error: 'Ungültige Dateianhang-Daten.' });
    }

    const safeSubject = sanitizeString(subject, 200);
    const safeNachricht = sanitizeString(nachricht, 50000);
    const safeReplyTo = replyTo ? sanitizeString(replyTo, 254) : undefined;

    const attachments = [];
    if (fileName && fileData) {
      attachments.push({
        filename: sanitizeFileName(fileName),
        content: fileData,
      });
    }

    await resend.emails.send({
      from: 'Kreativlabor <onboarding@resend.dev>',
      to: 'pauljunge12@icloud.com',
      reply_to: safeReplyTo,
      subject: safeSubject,
      text: safeNachricht,
      attachments,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler beim E-Mail-Versand.' });
  }
}
