import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY environment variable is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(503).json({ error: 'E-Mail-Dienst nicht konfiguriert (API-Key fehlt).' });
    }

    const { subject, nachricht, replyTo, fileName, fileData } = req.body;

    if (!subject || !nachricht) {
      return res.status(400).json({ error: 'Betreff und Nachricht sind Pflichtfelder.' });
    }

    const attachments = [];
    if (fileName && fileData) {
      attachments.push({
        filename: fileName,
        content: fileData, // base64
      });
    }

    const { data, error } = await resend.emails.send({
      from: 'Kreativlabor <onboarding@resend.dev>',
      to: 'pauljunge12@icloud.com',
      reply_to: replyTo,
      subject: subject,
      text: nachricht,
      attachments,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(502).json({ error: error.message || 'E-Mail konnte nicht gesendet werden.' });
    }

    res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Unhandled send error:', err);
    res.status(500).json({ error: err.message || 'Interner Serverfehler beim E-Mail-Versand.' });
  }
}
