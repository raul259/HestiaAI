import { Resend } from "resend";

interface IncidentEmailParams {
  hostEmail: string;
  hostName: string;
  propertyName: string;
  incidentTitle: string;
  incidentDescription: string;
  category: string;
  priority: string;
  guestName?: string;
  guestEmail?: string;
  scheduledAt?: Date;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "URGENTE",
};

const CATEGORY_LABELS: Record<string, string> = {
  electricity: "Electricidad / Luz",
  water: "Agua / Fontanería",
  wifi: "WiFi / Internet",
  appliance: "Electrodoméstico",
  access: "Acceso / Llaves",
  other: "Otro",
};

export async function enviarEmailIncidencia(params: IncidentEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const {
    hostEmail,
    hostName,
    propertyName,
    incidentTitle,
    incidentDescription,
    category,
    priority,
    guestName,
    guestEmail,
    scheduledAt,
  } = params;

  const priorityLabel = PRIORITY_LABELS[priority] ?? priority;
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const isUrgent = priority === "urgent";

  const scheduledSection = scheduledAt
    ? `<tr>
        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Cita propuesta</td>
        <td style="padding: 8px 0; font-weight: 600; color: #1B3022;">
          ${new Date(scheduledAt).toLocaleString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
      </tr>`
    : "";

  const guestSection =
    guestName || guestEmail
      ? `<tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Huésped</td>
          <td style="padding: 8px 0; font-weight: 600; color: #1B3022;">
            ${guestName ?? ""}${guestName && guestEmail ? " — " : ""}${guestEmail ?? ""}
          </td>
        </tr>`
      : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #F9FAFB; font-family: 'Inter', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: #1B3022; padding: 28px 32px; display: flex; align-items: center; gap: 12px;">
      <div style="display: inline-block;">
        <span style="font-size: 20px; font-weight: 700; color: white;">Hestia</span><span style="font-size: 20px; font-weight: 700; color: #88EBC0;">AI</span>
      </div>
    </div>

    <!-- Alert banner for urgent -->
    ${isUrgent ? `<div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 32px;">
      <p style="margin: 0; color: #DC2626; font-weight: 600; font-size: 14px;">⚠️ INCIDENCIA URGENTE — Requiere atención inmediata</p>
    </div>` : ""}

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px;">Hola, ${hostName}.</p>
      <h1 style="margin: 0 0 24px; font-size: 22px; color: #1B3022; line-height: 1.3;">
        Nueva incidencia en <span style="color: #1B3022; font-weight: 700;">${propertyName}</span>
      </h1>

      <!-- Incident title -->
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Problema reportado</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1B3022;">${incidentTitle}</p>
      </div>

      <!-- Description -->
      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Descripción</p>
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${incidentDescription}</p>
      </div>

      <!-- Details table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 14px; width: 40%;">Categoría</td>
          <td style="padding: 8px 0; font-weight: 600; color: #1B3022;">${categoryLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Prioridad</td>
          <td style="padding: 8px 0;">
            <span style="background: ${isUrgent ? "#FEE2E2" : priority === "high" ? "#FEF3C7" : "#F3F4F6"}; color: ${isUrgent ? "#DC2626" : priority === "high" ? "#D97706" : "#374151"}; padding: 2px 10px; border-radius: 20px; font-size: 13px; font-weight: 600;">
              ${priorityLabel}
            </span>
          </td>
        </tr>
        ${guestSection}
        ${scheduledSection}
      </table>

      <!-- CTA -->
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/host/dashboard"
        style="display: block; text-align: center; background: #1B3022; color: white; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600; font-size: 15px;">
        Ver en el panel
      </a>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; border-top: 1px solid #F3F4F6; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">HestiaAI · Asistencia inteligente para alojamientos vacacionales</p>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: "HestiaAI <onboarding@resend.dev>",
    to: hostEmail,
    subject: `${isUrgent ? "⚠️ URGENTE: " : ""}Nueva incidencia en ${propertyName} — ${incidentTitle}`,
    html,
  });
}

interface GuestReplyEmailParams {
  guestEmail: string;
  guestName?: string;
  propertyName: string;
  incidentTitle: string;
  hostName: string;
  message: string;
}

export async function enviarEmailRespuesta(params: GuestReplyEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { guestEmail, guestName, propertyName, incidentTitle, hostName, message } = params;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #F9FAFB; font-family: 'Inter', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: #1B3022; padding: 28px 32px;">
      <span style="font-size: 20px; font-weight: 700; color: white;">Hestia</span><span style="font-size: 20px; font-weight: 700; color: #88EBC0;">AI</span>
    </div>
    <div style="padding: 32px;">
      <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px;">Hola${guestName ? `, ${guestName}` : ""}.</p>
      <h1 style="margin: 0 0 24px; font-size: 20px; color: #1B3022;">Respuesta sobre tu incidencia en ${propertyName}</h1>
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Incidencia</p>
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1B3022;">${incidentTitle}</p>
      </div>
      <div style="background: #F0FDF4; border-left: 4px solid #88EBC0; padding: 16px 20px; border-radius: 0 10px 10px 0; margin-bottom: 24px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #6B7280;">Mensaje de ${hostName}</p>
        <p style="margin: 0; font-size: 15px; color: #1B3022; line-height: 1.6;">${message}</p>
      </div>
    </div>
    <div style="padding: 20px 32px; border-top: 1px solid #F3F4F6; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">HestiaAI · Asistencia inteligente para alojamientos vacacionales</p>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: "HestiaAI <onboarding@resend.dev>",
    to: guestEmail,
    subject: `Respuesta a tu incidencia en ${propertyName} — ${incidentTitle}`,
    html,
  });
}

interface GuestResolvedEmailParams {
  guestEmail: string;
  guestName?: string;
  propertyName: string;
  incidentTitle: string;
  hostName: string;
}

export async function enviarEmailResolucion(params: GuestResolvedEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { guestEmail, guestName, propertyName, incidentTitle, hostName } = params;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #F9FAFB; font-family: 'Inter', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

    <div style="background: #1B3022; padding: 28px 32px;">
      <span style="font-size: 20px; font-weight: 700; color: white;">Hestia</span><span style="font-size: 20px; font-weight: 700; color: #88EBC0;">AI</span>
    </div>

    <div style="padding: 32px;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="width: 56px; height: 56px; background: #D1FAE5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px;">✓</div>
        <h1 style="margin: 0; font-size: 22px; color: #1B3022;">Tu incidencia ha sido resuelta</h1>
      </div>

      <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Hola${guestName ? `, ${guestName}` : ""}. El equipo de <strong>${propertyName}</strong> ha marcado tu incidencia como resuelta.
      </p>

      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Incidencia resuelta</p>
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1B3022;">${incidentTitle}</p>
      </div>

      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0;">
        Si el problema persiste o necesitas más ayuda, puedes volver a reportarlo desde el asistente del alojamiento. — <strong>${hostName}</strong>
      </p>
    </div>

    <div style="padding: 20px 32px; border-top: 1px solid #F3F4F6; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">HestiaAI · Asistencia inteligente para alojamientos vacacionales</p>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: "HestiaAI <onboarding@resend.dev>",
    to: guestEmail,
    subject: `✓ Incidencia resuelta en ${propertyName} — ${incidentTitle}`,
    html,
  });
}
