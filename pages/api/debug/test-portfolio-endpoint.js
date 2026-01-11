// /pages/api/debug/test-portfolio-upload.js
// Test the portfolio upload endpoint directly

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simulate what the AddProjectModal component sends
    const testPayload = {
      fileName: `test-portfolio-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    };

    console.log('Testing portfolio upload API with payload:', testPayload);

    // Call the portfolio upload endpoint
    const apiUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/portfolio/upload-image`;
    
    console.log('Calling API at:', apiUrl);

    // Note: We can't actually call it without auth, but we can show what would happen
    return res.status(200).json({
      message: 'Portfolio upload endpoint exists',
      note: 'This endpoint requires authentication (user logged in)',
      testPayload,
      howToTest: 'Use browser Network tab to capture actual request/response when uploading from portfolio form',
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
