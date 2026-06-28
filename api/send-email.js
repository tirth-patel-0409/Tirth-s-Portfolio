export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle options preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { name, email, subject_line, message } = req.body;

  // Basic server-side validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required fields.' });
  }

  // Retrieve keys securely from environment variables
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Required for server-side (strict mode) access

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'Server Configuration Error: One or more EmailJS environment variables are missing. Ensure EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY are all set on the hosting platform.' 
    });
  }

  // Compile payload — accessToken is required for server-side strict mode
  const emailJsPayload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,  // Private key required for non-browser server calls
    template_params: {
      name,
      email,
      title: subject_line || 'No Subject',
      message,
      time: new Date().toLocaleString()
    }
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailJsPayload)
    });

    const responseText = await response.text();

    if (response.status === 200) {
      return res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } else {
      console.error('EmailJS Service Error Response:', responseText);
      return res.status(response.status).json({ success: false, error: responseText || 'EmailJS rejected the request.' });
    }
  } catch (error) {
    console.error('Connection Request Error:', error);
    return res.status(500).json({ success: false, error: `Connection failed: ${error.message}` });
  }
}
