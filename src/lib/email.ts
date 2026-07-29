import nodemailer from "nodemailer";
import { prisma } from "./prisma";

interface SendVisitEmailParams {
  customerEmail: string;
  customerName: string;
  visitDate: string;
  visitType: string;
  nextFollowupDate?: string;
}

export async function sendVisitThankYouEmail({
  customerEmail,
  customerName,
  visitDate,
  visitType,
  nextFollowupDate = "N/A",
}: SendVisitEmailParams) {
  if (!customerEmail) return;

  try {
    // 1. Fetch system settings
    const settings = await (prisma as any).systemSetting?.findMany() || [];
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => (settingsMap[s.key] = s.value));

    const companyName = settingsMap.companyName || "Sales Visit Pro Inc.";
    const smtpHost = settingsMap.smtpHost || process.env.SMTP_HOST || "smtp.mailtrap.io";
    const smtpPort = parseInt(settingsMap.smtpPort || process.env.SMTP_PORT || "2525", 10);
    const smtpUser = settingsMap.smtpUser || process.env.SMTP_USER || "";
    const smtpPass = settingsMap.smtpPass || process.env.SMTP_PASS || "";
    const smtpFrom = settingsMap.smtpFrom || process.env.SMTP_FROM || `"${companyName}" <noreply@salesvisitpro.com>`;

    // 2. Fetch email template
    const template = await prisma.emailTemplate.findFirst({
      where: { name: { contains: "Visit" }, status: "ACTIVE" },
    });

    let subject = "Thank You for Meeting With Us";
    let bodyTemplate = `Dear {{Customer Name}},

Thank you for taking your valuable time to meet with us on {{Visit Date}} for {{Visit Type}}.

Our representative will contact you on {{Next Follow-up Date}}.

Thank you.

Regards,
{{Company Name}}`;

    if (template) {
      subject = template.subject;
      bodyTemplate = template.body;
    }

    // 3. Replace variables
    const body = bodyTemplate
      .replace(/\{\{\s*Customer Name\s*\}\}/gi, customerName)
      .replace(/\{\{\s*Visit Date\s*\}\}/gi, visitDate)
      .replace(/\{\{\s*Visit Type\s*\}\}/gi, visitType)
      .replace(/\{\{\s*Next Follow-up Date\s*\}\}/gi, nextFollowupDate)
      .replace(/\{\{\s*Company Name\s*\}\}/gi, companyName);

    console.log(`✉️ Sending Visit Thank You email to: ${customerEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);

    // If SMTP user is set, send via nodemailer, otherwise simulate
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: customerEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br/>"),
      });
      console.log("✅ Email sent successfully via SMTP!");
    } else {
      console.log("ℹ️ [SIMULATED EMAIL LOG] SMTP not configured. Logged visit thank-you email above.");
    }
  } catch (error) {
    console.error("❌ Failed to send visit email:", error);
  }
}

interface SendLeadGreetingParams {
  customerEmail: string;
  customerName: string;
}

export async function sendLeadGreetingEmail({
  customerEmail,
  customerName,
}: SendLeadGreetingParams) {
  if (!customerEmail) return;

  try {
    const settings = await (prisma as any).systemSetting?.findMany() || [];
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => (settingsMap[s.key] = s.value));

    const companyName = settingsMap.companyName || "Sales Visit Pro Inc.";
    const smtpHost = settingsMap.smtpHost || process.env.SMTP_HOST || "smtp.mailtrap.io";
    const smtpPort = parseInt(settingsMap.smtpPort || process.env.SMTP_PORT || "2525", 10);
    const smtpUser = settingsMap.smtpUser || process.env.SMTP_USER || "";
    const smtpPass = settingsMap.smtpPass || process.env.SMTP_PASS || "";
    const smtpFrom = settingsMap.smtpFrom || process.env.SMTP_FROM || `"${companyName}" <noreply@salesvisitpro.com>`;

    const subject = `Welcome to ${companyName}!`;
    const bodyTemplate = `Dear {{Customer Name}},

Thank you for your interest in ${companyName}. We are excited to connect with you and explore how we can help you achieve your goals.

One of our representatives will be reaching out to you shortly.

Best Regards,
{{Company Name}} Team`;

    const body = bodyTemplate
      .replace(/\{\{\s*Customer Name\s*\}\}/gi, customerName)
      .replace(/\{\{\s*Company Name\s*\}\}/gi, companyName);

    console.log(`✉️ Sending Lead Greeting email to: ${customerEmail}`);

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: customerEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br/>"),
      });
      console.log("✅ Greeting Email sent successfully via SMTP!");
    } else {
      console.log("ℹ️ [SIMULATED EMAIL LOG] SMTP not configured. Logged lead greeting email above.");
    }
  } catch (error) {
    console.error("❌ Failed to send greeting email:", error);
  }
}
