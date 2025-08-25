import { setupDatabase } from './lib/supabase.js';

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

  if (req.method === 'POST') {
    try {
      console.log('Setting up database...');
      
      const success = await setupDatabase();
      
      if (success) {
        res.status(200).json({
          message: 'Database setup completed successfully',
          status: 'success'
        });
      } else {
        res.status(500).json({
          error: 'Database setup failed',
          message: 'Failed to create database tables'
        });
      }

    } catch (error) {
      console.error('Database setup error:', error);
      res.status(500).json({ 
        error: 'Database setup failed',
        message: 'An error occurred during database setup'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
