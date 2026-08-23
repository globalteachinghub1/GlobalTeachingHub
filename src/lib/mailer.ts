import nodemailer from "nodemailer";

const CONTACT_RECEIVER_EMAIL =
  process.env.CONTACT_RECEIVER_EMAIL ?? "globalteachinghub1@gmail.com";

const GMAIL_SMTP_USER = process.env.GMAIL_SMTP_USER;

type NotificationType = "contact" | "demo";

function getTransporter() {
  const user = process.env.GMAIL_SMTP_USER;
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Email is not configured: set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD in .env.local"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

export async function sendNotificationEmail({
  subject,
  replyTo,
  type = "contact",
  lines,
}: {
  subject: string;
  replyTo?: string;
  type?: NotificationType;
  lines: { label: string; value: string }[];
}) {
  const transporter = getTransporter();

  const isDemo = type === "demo";

  const title = isDemo
    ? "New Free Demo Request 🎓"
    : "New Contact Message 📩";

  const description = isDemo
    ? "A new student has submitted a free demo request."
    : "Someone has submitted a new message through your website.";

  const sectionTitle = isDemo
    ? "Student Information"
    : "Message Details";

  const actionMessage = isDemo
    ? "Please contact the student to confirm their demo session."
    : "Please review the message and reply to the sender when convenient.";

  const text = lines
    .map(({ label, value }) => `${label}: ${value}`)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="
    width:100%;
    padding:40px 15px;
    box-sizing:border-box;
  ">

    <div style="
      max-width:620px;
      margin:0 auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      border:1px solid #e5eaf1;
      box-shadow:0 4px 18px rgba(20,40,80,0.08);
    ">

      <!-- Header -->
      <div style="
        background:#0f766e;
        padding:28px 32px;
        color:#ffffff;
      ">

        <div style="
          font-size:14px;
          font-weight:bold;
          letter-spacing:0.5px;
          opacity:0.9;
          margin-bottom:8px;
        ">
          GLOBAL TEACHING HUB
        </div>

        <div style="
          font-size:26px;
          line-height:1.3;
          font-weight:700;
        ">
          ${title}
        </div>

        <div style="
          font-size:14px;
          margin-top:8px;
          opacity:0.9;
        ">
          ${description}
        </div>

      </div>

      <!-- Content -->
      <div style="padding:30px 32px;">

        <div style="
          font-size:13px;
          color:#667085;
          margin-bottom:18px;
          text-transform:uppercase;
          letter-spacing:0.6px;
          font-weight:600;
        ">
          ${sectionTitle}
        </div>

        ${lines
          .map(
            ({ label, value }) => `
              <div style="
                margin-bottom:14px;
                padding:16px 18px;
                background:#f8fafc;
                border:1px solid #e8edf3;
                border-radius:10px;
              ">

                <div style="
                  font-size:12px;
                  color:#667085;
                  font-weight:600;
                  margin-bottom:6px;
                  text-transform:uppercase;
                  letter-spacing:0.4px;
                ">
                  ${escapeHtml(label)}
                </div>

                <div style="
                  font-size:15px;
                  color:#172033;
                  font-weight:500;
                  word-break:break-word;
                ">
                  ${escapeHtml(value)}
                </div>

              </div>
            `
          )
          .join("")}

        <!-- Action -->
        <div style="
          margin-top:24px;
          padding:18px;
          background:#f0fdfa;
          border:1px solid #ccfbf1;
          border-radius:10px;
          color:#115e59;
          font-size:14px;
          line-height:1.6;
        ">
          <strong>Next step:</strong><br />
          ${actionMessage}
        </div>

      </div>

      <!-- Footer -->
      <div style="
        border-top:1px solid #edf0f4;
        padding:20px 32px;
        background:#fafbfc;
        color:#98a2b3;
        font-size:12px;
        line-height:1.6;
      ">

        This notification was automatically generated from
        <strong style="color:#667085;">Global Teaching Hub</strong>.

      </div>

    </div>

  </div>

</body>
</html>
`;

  await transporter.sendMail({
    from: `"Global Teaching Hub" <${GMAIL_SMTP_USER}>`,
    to: CONTACT_RECEIVER_EMAIL,
    ...(replyTo ? { replyTo } : {}),
    subject,
    text,
    html,
  });
}

function getSiteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const transporter = getTransporter();
  const subject = "Reset your password — Global Teaching Hub";

  const text = [
    `Hi ${name.split(" ")[0]},`,
    "",
    "We received a request to reset your Global Teaching Hub password. This link expires in 1 hour:",
    resetUrl,
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial,Helvetica,sans-serif; color:#172033;">
  <div style="width:100%; padding:40px 15px; box-sizing:border-box;">
    <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5eaf1; box-shadow:0 4px 18px rgba(20,40,80,0.08);">
      <div style="background:linear-gradient(135deg,#0f766e,#115e59); padding:36px 32px; color:#ffffff; text-align:center;">
        <div style="font-size:14px; font-weight:bold; letter-spacing:1px; opacity:0.85; margin-bottom:14px;">GLOBAL TEACHING HUB</div>
        <div style="font-size:26px; line-height:1.3; font-weight:700;">Reset Your Password 🔒</div>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 22px; font-size:15px; color:#344054; line-height:1.6;">
          Hi ${escapeHtml(name.split(" ")[0])}, we received a request to reset your password. This link expires in 1 hour.
        </p>
        <div style="text-align:center; margin:28px 0;">
          <a href="${resetUrl}" style="display:inline-block; background:#0f766e; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:14px 32px; border-radius:999px;">
            Reset Password →
          </a>
        </div>
        <p style="margin:0; font-size:13px; color:#667085; line-height:1.6;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
      <div style="border-top:1px solid #edf0f4; padding:20px 32px; background:#fafbfc; color:#98a2b3; font-size:12px; line-height:1.6; text-align:center;">
        This email was sent because a password reset was requested for your
        <strong style="color:#667085;">Global Teaching Hub</strong> account.
      </div>
    </div>
  </div>
</body>
</html>
`;

  await transporter.sendMail({
    from: `"Global Teaching Hub" <${GMAIL_SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

const ROLE_COPY = {
  ADMIN: {
    title: "Your Admin Account is Ready 🎉",
    description: "You now have administrator access to Global Teaching Hub.",
    loginPath: "/admin/login",
    loginLabel: "Go to Staff Login",
  },
  TEACHER: {
    title: "Welcome to Global Teaching Hub 🎓",
    description: "Your teacher account has been created.",
    loginPath: "/admin/login",
    loginLabel: "Go to Staff Login",
  },
  STUDENT: {
    title: "Welcome to Global Teaching Hub 🎓",
    description: "Your student account has been created.",
    loginPath: "/login",
    loginLabel: "Go to Student Login",
  },
  PARENT: {
    title: "Welcome to Global Teaching Hub 👨‍👩‍👧",
    description: "Your parent account has been created.",
    loginPath: "/login",
    loginLabel: "Go to Parent Login",
  },
} as const;

export async function sendAccountCreatedEmail({
  to,
  name,
  role,
  email,
  password,
  details = [],
}: {
  to: string;
  name: string;
  role: keyof typeof ROLE_COPY;
  email: string;
  /** Omit for self-registered accounts — the user already knows their password. */
  password?: string;
  /** Extra context rows, e.g. course/teacher assignment. */
  details?: { label: string; value: string }[];
}) {
  const transporter = getTransporter();
  const copy = ROLE_COPY[role];
  const loginUrl = `${getSiteUrl()}${copy.loginPath}`;
  const subject = `${copy.title.replace(/\s*🎉|\s*🎓/, "")} — Global Teaching Hub`;

  const infoRows = [{ label: "Name", value: name }, { label: "Email", value: email }, ...details];

  const text = [
    copy.description,
    "",
    ...infoRows.map(({ label, value }) => `${label}: ${value}`),
    ...(password ? ["", `Temporary password: ${password}`] : []),
    "",
    `Log in: ${loginUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="width:100%; padding:40px 15px; box-sizing:border-box;">

    <div style="
      max-width:620px;
      margin:0 auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      border:1px solid #e5eaf1;
      box-shadow:0 4px 18px rgba(20,40,80,0.08);
    ">

      <!-- Header -->
      <div style="
        background:linear-gradient(135deg,#0f766e,#115e59);
        padding:36px 32px;
        color:#ffffff;
        text-align:center;
      ">
        <div style="
          font-size:14px;
          font-weight:bold;
          letter-spacing:1px;
          opacity:0.85;
          margin-bottom:14px;
        ">
          GLOBAL TEACHING HUB
        </div>

        <div style="font-size:26px; line-height:1.3; font-weight:700;">
          ${copy.title}
        </div>

        <div style="font-size:14px; margin-top:10px; opacity:0.92;">
          ${copy.description}
        </div>
      </div>

      <!-- Content -->
      <div style="padding:32px;">

        <p style="margin:0 0 22px; font-size:15px; color:#344054; line-height:1.6;">
          Hi ${escapeHtml(name.split(" ")[0])}, here are your account details:
        </p>

        <div style="
          font-size:13px;
          color:#667085;
          margin-bottom:14px;
          text-transform:uppercase;
          letter-spacing:0.6px;
          font-weight:600;
        ">
          Account Details
        </div>

        ${infoRows
          .map(
            ({ label, value }) => `
              <div style="
                margin-bottom:12px;
                padding:14px 18px;
                background:#f8fafc;
                border:1px solid #e8edf3;
                border-radius:10px;
              ">
                <div style="
                  font-size:12px;
                  color:#667085;
                  font-weight:600;
                  margin-bottom:4px;
                  text-transform:uppercase;
                  letter-spacing:0.4px;
                ">
                  ${escapeHtml(label)}
                </div>
                <div style="font-size:15px; color:#172033; font-weight:500; word-break:break-word;">
                  ${escapeHtml(value)}
                </div>
              </div>
            `
          )
          .join("")}

        ${
          password
            ? `
        <div style="
          margin-top:22px;
          padding:20px;
          background:#fffbeb;
          border:1px dashed #f5c451;
          border-radius:12px;
        ">
          <div style="
            font-size:12px;
            color:#92610a;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:0.5px;
            margin-bottom:10px;
          ">
            🔑 Your Login Credentials
          </div>
          <div style="font-size:13px; color:#92610a; margin-bottom:4px;">Email</div>
          <div style="
            font-family:'Courier New',monospace;
            font-size:15px;
            color:#172033;
            background:#ffffff;
            border:1px solid #f0dca0;
            border-radius:8px;
            padding:10px 14px;
            margin-bottom:12px;
            word-break:break-all;
          ">${escapeHtml(email)}</div>
          <div style="font-size:13px; color:#92610a; margin-bottom:4px;">Temporary Password</div>
          <div style="
            font-family:'Courier New',monospace;
            font-size:15px;
            font-weight:700;
            color:#172033;
            background:#ffffff;
            border:1px solid #f0dca0;
            border-radius:8px;
            padding:10px 14px;
            letter-spacing:0.5px;
          ">${escapeHtml(password)}</div>
          <div style="font-size:12px; color:#92610a; margin-top:12px; line-height:1.5;">
            Please keep this somewhere safe — this email is the only place it&rsquo;s shown.
          </div>
        </div>
        `
            : ""
        }

        <!-- CTA -->
        <div style="text-align:center; margin-top:28px;">
          <a href="${loginUrl}" style="
            display:inline-block;
            background:#0f766e;
            color:#ffffff;
            text-decoration:none;
            font-size:15px;
            font-weight:700;
            padding:14px 32px;
            border-radius:999px;
          ">
            ${copy.loginLabel} →
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="
        border-top:1px solid #edf0f4;
        padding:20px 32px;
        background:#fafbfc;
        color:#98a2b3;
        font-size:12px;
        line-height:1.6;
        text-align:center;
      ">
        This email was sent because an account was created for you at
        <strong style="color:#667085;">Global Teaching Hub</strong>.
        If this wasn&rsquo;t you, please contact us.
      </div>

    </div>

  </div>

</body>
</html>
`;

  await transporter.sendMail({
    from: `"Global Teaching Hub" <${GMAIL_SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderStudentEmail({
  title,
  description,
  greetingName,
  rows,
}: {
  title: string;
  description: string;
  greetingName: string;
  rows: { label: string; value: string }[];
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>

<body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial,Helvetica,sans-serif; color:#172033;">
  <div style="width:100%; padding:40px 15px; box-sizing:border-box;">
    <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5eaf1; box-shadow:0 4px 18px rgba(20,40,80,0.08);">

      <div style="background:linear-gradient(135deg,#0f766e,#115e59); padding:28px 32px; color:#ffffff;">
        <div style="font-size:14px; font-weight:bold; letter-spacing:0.5px; opacity:0.9; margin-bottom:8px;">GLOBAL TEACHING HUB</div>
        <div style="font-size:24px; line-height:1.3; font-weight:700;">${title}</div>
      </div>

      <div style="padding:30px 32px;">
        <p style="margin:0 0 20px; font-size:15px; color:#344054; line-height:1.6;">
          Hi ${escapeHtml(greetingName)}, ${description}
        </p>

        ${rows
          .map(
            ({ label, value }) => `
              <div style="margin-bottom:14px; padding:16px 18px; background:#f8fafc; border:1px solid #e8edf3; border-radius:10px;">
                <div style="font-size:12px; color:#667085; font-weight:600; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.4px;">
                  ${escapeHtml(label)}
                </div>
                <div style="font-size:15px; color:#172033; font-weight:500; word-break:break-word;">
                  ${escapeHtml(value)}
                </div>
              </div>
            `
          )
          .join("")}
      </div>

      <div style="border-top:1px solid #edf0f4; padding:20px 32px; background:#fafbfc; color:#98a2b3; font-size:12px; line-height:1.6;">
        This notification was automatically generated from
        <strong style="color:#667085;">Global Teaching Hub</strong>.
      </div>

    </div>
  </div>
</body>
</html>
`;
}

async function sendStudentEmail({
  to,
  subject,
  title,
  description,
  greetingName,
  rows,
}: {
  to: string;
  subject: string;
  title: string;
  description: string;
  greetingName: string;
  rows: { label: string; value: string }[];
}) {
  const transporter = getTransporter();
  const html = renderStudentEmail({ title, description, greetingName, rows });
  const text = [description, "", ...rows.map(({ label, value }) => `${label}: ${value}`)].join(
    "\n"
  );

  await transporter.sendMail({
    from: `"Global Teaching Hub" <${GMAIL_SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendInvoiceGeneratedEmail({
  to,
  studentName,
  invoiceNumber,
  amount,
  dueDate,
}: {
  to: string;
  studentName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: Date | null;
}) {
  await sendStudentEmail({
    to,
    subject: `New Invoice ${invoiceNumber} — Global Teaching Hub`,
    title: "New Invoice Generated 🧾",
    description: "a new invoice has been generated for your account:",
    greetingName: studentName.split(" ")[0],
    rows: [
      { label: "Invoice Number", value: invoiceNumber },
      { label: "Amount", value: amount },
      ...(dueDate ? [{ label: "Due Date", value: dueDate.toLocaleDateString() }] : []),
    ],
  });
}

export async function sendPaymentReminderEmail({
  to,
  studentName,
  invoiceNumber,
  amount,
  dueDate,
}: {
  to: string;
  studentName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: Date | null;
}) {
  await sendStudentEmail({
    to,
    subject: `Payment Reminder: Invoice ${invoiceNumber} — Global Teaching Hub`,
    title: "Payment Reminder ⏰",
    description: "this is a friendly reminder that the following invoice is still unpaid:",
    greetingName: studentName.split(" ")[0],
    rows: [
      { label: "Invoice Number", value: invoiceNumber },
      { label: "Amount", value: amount },
      ...(dueDate ? [{ label: "Due Date", value: dueDate.toLocaleDateString() }] : []),
    ],
  });
}

export async function sendWeeklyReportEmail({
  to,
  studentName,
  courseName,
  weekStart,
  weekEnd,
  presentCount,
  totalCount,
  topicsCovered,
  teacherRemarks,
}: {
  to: string;
  studentName: string;
  courseName: string;
  weekStart: Date;
  weekEnd: Date;
  presentCount: number;
  totalCount: number;
  topicsCovered: string;
  teacherRemarks: string | null;
}) {
  await sendStudentEmail({
    to,
    subject: `Weekly Progress Report — ${courseName} — Global Teaching Hub`,
    title: "Weekly Progress Report 📘",
    description: `here's ${studentName.split(" ")[0]}'s progress in ${courseName} for the week of ${weekStart.toLocaleDateString()}:`,
    greetingName: studentName.split(" ")[0],
    rows: [
      { label: "Course", value: courseName },
      { label: "Attendance", value: `${presentCount}/${totalCount} classes attended` },
      { label: "Week", value: `${weekStart.toLocaleDateString()} – ${weekEnd.toLocaleDateString()}` },
      { label: "Topics Covered", value: topicsCovered },
      ...(teacherRemarks ? [{ label: "Teacher Remarks", value: teacherRemarks }] : []),
    ],
  });
}

export async function sendMonthlyReportEmail({
  to,
  studentName,
  courseName,
  month,
  year,
  attendancePercent,
  performanceSummary,
  teacherRemarks,
}: {
  to: string;
  studentName: string;
  courseName: string;
  month: string;
  year: number;
  attendancePercent: number;
  performanceSummary: string;
  teacherRemarks: string | null;
}) {
  await sendStudentEmail({
    to,
    subject: `Monthly Progress Report — ${courseName} — ${month} ${year} — Global Teaching Hub`,
    title: "Monthly Progress Report 📗",
    description: `here's ${studentName.split(" ")[0]}'s progress report for ${courseName}, ${month} ${year}:`,
    greetingName: studentName.split(" ")[0],
    rows: [
      { label: "Course", value: courseName },
      { label: "Attendance", value: `${attendancePercent}%` },
      { label: "Performance Summary", value: performanceSummary },
      ...(teacherRemarks ? [{ label: "Teacher Remarks", value: teacherRemarks }] : []),
    ],
  });
}