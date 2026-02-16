import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

/**
 * Generate a beautiful HTML chat transcript
 */
function generateChatHtml(guestName: string, messages: any[]) {
  const messageHtml = messages.map(m => `
    <div style="margin-bottom: 15px; text-align: ${m.role === 'user' ? 'right' : 'left'};">
      <div style="display: inline-block; padding: 10px 15px; border-radius: 15px; max-width: 80%; 
                  background-color: ${m.role === 'user' ? '#005F02' : '#f1f1f1'}; 
                  color: ${m.role === 'user' ? '#ffffff' : '#333333'};
                  font-family: Arial, sans-serif; font-size: 14px;">
        <strong style="display: block; font-size: 11px; margin-bottom: 4px; opacity: 0.8;">
          ${m.role === 'user' ? (guestName || 'User') : 'Arnold AI'}
        </strong>
        ${m.content.replace(/\n/g, '<br>')}
        <div style="font-size: 10px; margin-top: 5px; opacity: 0.6;">${m.timestamp || ''}</div>
      </div>
    </div>
  `).join('');

  return `
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #005F02; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">IMG Financial Lead Detected</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Conversation Transcript for <strong>${guestName || 'Anonymous Visitor'}</strong></p>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        ${messageHtml}
      </div>
      <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
        Sent by Arnold AI Sentinel • ${new Date().toLocaleString()}
      </div>
    </div>
  `;
}

export async function sendLeadEmail(guestName: string, messages: any[]) {
  if (!process.env.ADMIN_EMAIL) {
    console.warn("📧 Mailer: ADMIN_EMAIL not defined. skipping email.");
    return false;
  }

  try {
    const html = generateChatHtml(guestName, messages);
    
    await transporter.sendMail({
      from: `"Arnold AI Sentinel" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🚀 New Financial Lead: ${guestName || 'Anonymous Visitor'}`,
      html: html,
    });

    console.log(`📧 Mailer: Lead email sent for ${guestName || 'Anonymous'}`);
    return true;
  } catch (err) {
    console.error("📧 Mailer Error:", err);
    return false;
  }
}
