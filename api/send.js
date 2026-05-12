import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { subject, nachricht, replyTo, fileName, fileData } = req.body;

    const attachments = [];
    if (fileName && fileData) {
      attachments.push({
        filename: fileName,
        content: fileData, // base64
      });
    }

    await resend.emails.send({
      from: 'Kreativlabor <onboarding@resend.dev>',
      to: 'paul.junge@egn-noh.de',
      reply_to: replyTo,
      subject: subject,
      text: nachricht,
      attachments,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
