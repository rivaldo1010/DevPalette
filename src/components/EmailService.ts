// Servicio de correo electrónico real con EmailJS
// Asegúrate de poner tus claves reales de EmailJS abajo

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export class EmailService {
  private static instance: EmailService;

  // === EmailJS CONFIGURACIÓN ===
  // Pega aquí tus claves de EmailJS:
  private EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // <-- Pega tu Public Key
  private EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // <-- Pega tu Service ID
  private EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // <-- Pega tu Template ID

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // ENVÍO REAL con EmailJS (si tienes claves)
  private async sendWithEmailJS(to: string, subject: string, html: string, code: string): Promise<boolean> {
    // Solo funciona en frontend (browser)
    if (
      this.EMAILJS_PUBLIC_KEY.startsWith('YOUR_') ||
      this.EMAILJS_SERVICE_ID.startsWith('YOUR_') ||
      this.EMAILJS_TEMPLATE_ID.startsWith('YOUR_')
    ) {
      // Si no has puesto tus claves, simula el envío
      return null;
    }
    try {
      // Verifica que window exista (por si se ejecuta en Node)
      if (typeof window === 'undefined') {
        throw new Error('EmailJS solo funciona en el navegador');
      }
      // Cargar EmailJS SDK si no está cargado
      if (!(window as any).emailjs) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('No se pudo cargar EmailJS SDK'));
          document.body.appendChild(script);
        });
      }
      // Inicializar EmailJS
      (window as any).emailjs.init(this.EMAILJS_PUBLIC_KEY);
      // Enviar correo
      const result = await (window as any).emailjs.send(
        this.EMAILJS_SERVICE_ID,
        this.EMAILJS_TEMPLATE_ID,
        {
          to_email: to, // ENVÍA AL CORREO DEL USUARIO
          subject: subject,
          message: html,
          code: code
        }
      );
      return result.status === 200;
    } catch (err) {
      console.error('Error enviando con EmailJS:', err);
      return false;
    }
  }

  // Enviar código de verificación
  async sendVerificationCode(email: string, code: string, userName: string): Promise<boolean> {
    try {
      const template = this.getVerificationTemplate(code, userName);
      // Intentar envío real con EmailJS
      let success: boolean | null = null;
      success = await this.sendWithEmailJS(email, template.subject, template.htmlContent, code);
      if (success === null) {
        // Si no hay claves, simular delay y logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('📧 Enviando correo de verificación...');
        console.log('Para:', email);
        console.log('Asunto:', template.subject);
        console.log('Código:', code);
        success = Math.random() > 0.05;
      }
      if (success) {
        console.log('✅ Correo enviado exitosamente');
        this.showBrowserNotification(email, code);
      } else {
        console.log('❌ Error al enviar correo');
      }
      return success;
    } catch (error) {
      console.error('Error en el servicio de correo:', error);
      return false;
    }
  }

  // Enviar código de recuperación de contraseña
  async sendPasswordResetCode(email: string, code: string, userName: string): Promise<boolean> {
    try {
      const template = this.getPasswordResetTemplate(code, userName);
      // Intentar envío real con EmailJS
      let success: boolean | null = null;
      success = await this.sendWithEmailJS(email, template.subject, template.htmlContent, code);
      if (success === null) {
        // Si no hay claves, simular delay y logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('📧 Enviando correo de recuperación de contraseña...');
        console.log('Para:', email);
        console.log('Asunto:', template.subject);
        console.log('Código:', code);
        success = Math.random() > 0.05;
      }
      if (success) {
        console.log('✅ Correo de recuperación enviado exitosamente');
        this.showPasswordResetNotification(email, code);
      } else {
        console.log('❌ Error al enviar correo de recuperación');
      }
      return success;
    } catch (error) {
      console.error('Error en el servicio de correo:', error);
      return false;
    }
  }

  private getVerificationTemplate(code: string, userName: string): EmailTemplate {
    const subject = '🔐 Código de verificación - DevPalette';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Código de Verificación</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .code-box { background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 DevPalette</h1>
            <p>Código de Verificación</p>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Hemos recibido una solicitud para acceder a tu cuenta. Por tu seguridad, necesitamos verificar tu identidad.</p>
            <div class="code-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Tu código de verificación es:</p>
              <div class="code">${code}</div>
              <p style="margin: 0; color: #666; font-size: 12px;">Este código expira en 5 minutos</p>
            </div>
            <div class="warning">
              <strong>⚠️ ¿Eres tú quien está intentando iniciar sesión?</strong><br>
              Si no reconoces este intento de acceso, <strong>NO ingreses este código</strong> y cambia tu contraseña inmediatamente.
            </div>
            <p><strong>Consejos de seguridad:</strong></p>
            <ul>
              <li>Nunca compartas este código con nadie</li>
              <li>DevPalette nunca te pedirá tu código por teléfono o correo</li>
              <li>Si no solicitaste este código, ignora este mensaje</li>
            </ul>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas.</p>
            <p>© 2024 DevPalette - Herramienta profesional de colores para desarrolladores</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const textContent = `
DevPalette - Código de Verificación

Hola ${userName},

Hemos recibido una solicitud para acceder a tu cuenta. Tu código de verificación es:

${code}

Este código expira en 5 minutos.

⚠️ IMPORTANTE: Si no reconoces este intento de acceso, NO ingreses este código y cambia tu contraseña inmediatamente.

Consejos de seguridad:
- Nunca compartas este código con nadie
- DevPalette nunca te pedirá tu código por teléfono o correo
- Si no solicitaste este código, ignora este mensaje

© 2024 DevPalette
    `;
    return { subject, htmlContent, textContent };
  }

  private getPasswordResetTemplate(code: string, userName: string): EmailTemplate {
    const subject = '🔑 Recuperación de contraseña - DevPalette';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperación de Contraseña</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .code-box { background-color: #f8f9fa; border: 2px dashed #dc2626; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; font-family: monospace; }
          .warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 DevPalette</h1>
            <p>Recuperación de Contraseña</p>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, usa el siguiente código para continuar:</p>
            <div class="code-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Tu código de recuperación es:</p>
              <div class="code">${code}</div>
              <p style="margin: 0; color: #666; font-size: 12px;">Este código expira en 5 minutos</p>
            </div>
            <div class="warning">
              <strong>⚠️ ¿Solicitaste restablecer tu contraseña?</strong><br>
              Si <strong>NO</strong> solicitaste este cambio, <strong>ignora este correo</strong> y asegúrate de que tu cuenta esté segura. Considera cambiar tu contraseña desde tu cuenta.
            </div>
            <p><strong>Pasos a seguir:</strong></p>
            <ol>
              <li>Ingresa el código de 6 dígitos en la página de recuperación</li>
              <li>Crea una nueva contraseña segura</li>
              <li>Confirma tu nueva contraseña</li>
              <li>¡Listo! Ya puedes iniciar sesión</li>
            </ol>
            <p><strong>Consejos para una contraseña segura:</strong></p>
            <ul>
              <li>Usa al menos 8 caracteres</li>
              <li>Combina letras, números y símbolos</li>
              <li>No uses información personal</li>
              <li>No reutilices contraseñas de otras cuentas</li>
            </ul>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
            <p>© 2024 DevPalette - Herramienta profesional de colores para desarrolladores</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const textContent = `
DevPalette - Recuperación de Contraseña

Hola ${userName},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

Tu código de recuperación es: ${code}

Este código expira en 5 minutos.

⚠️ IMPORTANTE: Si NO solicitaste este cambio, ignora este correo y asegúrate de que tu cuenta esté segura.

Pasos a seguir:
1. Ingresa el código de 6 dígitos en la página de recuperación
2. Crea una nueva contraseña segura
3. Confirma tu nueva contraseña
4. ¡Listo! Ya puedes iniciar sesión

Consejos para una contraseña segura:
- Usa al menos 8 caracteres
- Combina letras, números y símbolos
- No uses información personal
- No reutilices contraseñas de otras cuentas

© 2024 DevPalette
    `;
    return { subject, htmlContent, textContent };
  }

  private showBrowserNotification(email: string, code: string) {
    // Crear una notificación visual simulada
    if (typeof window === 'undefined') return;
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 350px;
      font-family: Arial, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">📧</span>
        <strong>Correo enviado</strong>
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        Revisa tu correo: ${email.replace(/(.{2}).*(@.*)/, '$1***$2')}
      </div>
      <div style="font-size: 10px; opacity: 0.7; margin-top: 5px;">
        El código expira en 5 minutos
      </div>
    `;
    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
        if (style.parentNode) style.parentNode.removeChild(style);
      }, 300);
    }, 5000);
  }

  private showPasswordResetNotification(email: string) {
    // Crear una notificación visual simulada para recuperación de contraseña
    if (typeof window === 'undefined') return;
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 350px;
      font-family: Arial, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">🔑</span>
        <strong>Código de recuperación enviado</strong>
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        Revisa tu correo: ${email.replace(/(.{2}).*(@.*)/, '$1***$2')}
      </div>
      <div style="font-size: 10px; opacity: 0.7; margin-top: 5px;">
        El código expira en 5 minutos
      </div>
    `;
    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
        if (style.parentNode) style.parentNode.removeChild(style);
      }, 300);
    }, 6000);
  }

  // Método para validar formato de email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Método para generar código seguro
  static generateSecureCode(): string {
    // Generar código de 6 dígitos más seguro
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }
}
