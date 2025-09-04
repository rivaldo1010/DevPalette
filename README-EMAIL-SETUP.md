# Configuración de Correo Electrónico Real

El código ya NO se muestra en la página. Ahora necesitas configurar un servicio de correo real para que los códigos lleguen al email.

## Opción 1: EmailJS (Recomendado - Más Fácil)

### Pasos:
1. Ve a [EmailJS](https://www.emailjs.com/) y crea una cuenta gratuita
2. Crea un servicio de email (Gmail, Outlook, etc.)
3. Crea una plantilla de correo
4. Obtén tus credenciales:
   - Service ID
   - Template ID  
   - Public Key

### Configuración:
1. En `index.html`, reemplaza `'YOUR_PUBLIC_KEY'` con tu clave pública
2. En `EmailService.ts`, en el método `sendWithEmailJS`, reemplaza:
   - `'YOUR_SERVICE_ID'` con tu Service ID
   - `'YOUR_TEMPLATE_ID'` con tu Template ID
   - `'YOUR_PUBLIC_KEY'` con tu Public Key

### Plantilla de EmailJS:
```
Asunto: Código de verificación - DevPalette

Hola,

Tu código de verificación es: {{code}}

Este código expira en 5 minutos.

Saludos,
DevPalette
```

## Opción 2: Netlify Functions + SendGrid

### Si usas Netlify para hosting:
1. Crea una cuenta en [SendGrid](https://sendgrid.com/)
2. Obtén tu API Key
3. Crea una función en `netlify/functions/send-email.js`

## Opción 3: API Backend Propia

### Si tienes tu propio backend:
1. Crea un endpoint `/api/send-email`
2. Usa un servicio como SendGrid, Mailgun, o Nodemailer
3. El endpoint debe recibir: `to`, `subject`, `html`, `code`

## Verificación

Una vez configurado cualquier método:
1. El código YA NO aparece en la página
2. Solo verás "¡Código enviado!" 
3. El código llegará a tu correo real
4. Ingresa el código que recibiste por email

## Seguridad

✅ El código ya no se muestra en la interfaz
✅ Solo se envía por correo electrónico
✅ El código expira en 5 minutos
✅ Máximo 3 intentos de verificación

## Problemas Comunes

- **No llega el correo**: Revisa spam/promociones
- **Error de configuración**: Verifica las credenciales
- **Límites de envío**: Los servicios gratuitos tienen límites diarios