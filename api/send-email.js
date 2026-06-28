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

  // Basic server-side verification validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required fields.' });
  }

  // Retrieve keys securely from environment variables
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'Server Configuration Error: EmailJS environment variables are missing on the hosting platform.' 
    });
  }

  // Compile payload matching target EmailJS variables
  const emailJsPayload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
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
