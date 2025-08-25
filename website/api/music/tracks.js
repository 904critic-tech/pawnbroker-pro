export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return empty tracks array - no mock data
    const tracks = [];

    return res.status(200).json({
      success: true,
      tracks,
      total: tracks.length,
      page: 1,
      limit: 10,
      message: 'No tracks available yet. Upload your first track to get started!'
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
