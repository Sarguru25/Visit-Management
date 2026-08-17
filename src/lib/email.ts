import nodemailer from "nodemailer";
import { prisma } from "./prisma";

interface SendVisitEmailParams {
  customerEmail: string;
  customerName: string;
  visitDate: string;
  visitType: string;
  nextFollowupDate?: string;
  companyId?: string;
  companyName?: string;
}

export async function sendVisitThankYouEmail({
  customerEmail,
  customerName,
  visitDate,
  visitType,
  nextFollowupDate = "N/A",
  companyId,
  companyName = "Sales Visit Pro Inc.",
}: SendVisitEmailParams) {
  if (!customerEmail) return;

  try {
    const smtpHost = "smtp.gmail.com";
    const smtpPort = 587;
    const smtpUser = process.env.GMAIL_USER || "";
    const smtpPass = process.env.GMAIL_PASS || "";
    const smtpFrom = `"${companyName}" <${smtpUser}>`;

    // 2. Fetch email template specific to the company if companyId is provided
    const templateWhere: any = { name: { contains: "Visit" }, status: "ACTIVE" };
    if (companyId) {
      templateWhere.companyId = companyId;
    }

    const template = await prisma.emailTemplate.findFirst({
      where: templateWhere,
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
      
      // Use senderEmail from template if available
      if (template.senderEmail) {
        // We can't change the actual SMTP user easily without a custom integration for each company, 
        // but we can at least set the 'from' address label to the template's senderEmail if we want,
        // or just use it as is.
      }
    }

    // 3. Replace variables
    const body = bodyTemplate
      .replace(/\{\{\s*Customer Name\s*\}\}/gi, customerName)
      .replace(/\{\{\s*Visit Date\s*\}\}/gi, visitDate)
      .replace(/\{\{\s*Visit Type\s*\}\}/gi, visitType)
      .replace(/\{\{\s*Next Follow-up Date\s*\}\}/gi, nextFollowupDate)
      .replace(/\{\{\s*Company Name\s*\}\}/gi, companyName);

    console.log(`✉️ Sending Visit Thank You email to: ${customerEmail}`);
    console.log(`Company: ${companyName}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);

    // If SMTP user is set, send via nodemailer, otherwise simulate
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
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
    const smtpHost = "smtp.gmail.com";
    const smtpPort = 587;
    const smtpUser = process.env.GMAIL_USER || "";
    const smtpPass = process.env.GMAIL_PASS || "";
    const companyName = "Sales Visit Pro Inc.";
    const smtpFrom = `"${companyName}" <${smtpUser}>`;

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
        secure: false,
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
