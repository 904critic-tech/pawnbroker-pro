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
      const { trackId, trackTitle, artist, source, sourceUrl, license, licenseUrl } = req.body;

      if (!trackTitle || !artist || !source || !license) {
        return res.status(400).json({
          success: false,
          error: 'Missing required track information'
        });
      }

      // Generate different attribution formats based on license type
      let attributionText = '';
      let attributionHtml = '';
      let licenseInfo = '';

      switch (license) {
        case 'CC BY 4.0':
          attributionText = `${trackTitle} by ${artist} is licensed under CC BY 4.0. Source: ${source}`;
          attributionHtml = `<a href="${sourceUrl || '#'}">${trackTitle}</a> by ${artist} is licensed under <a href="${licenseUrl || 'https://creativecommons.org/licenses/by/4.0/'}">CC BY 4.0</a>. Source: ${source}`;
          licenseInfo = 'Creative Commons Attribution 4.0 International License - You must give appropriate credit, provide a link to the license, and indicate if changes were made.';
          break;
        
        case 'CC BY-SA 3.0':
          attributionText = `${trackTitle} by ${artist} is licensed under CC BY-SA 3.0. Source: ${source}`;
          attributionHtml = `<a href="${sourceUrl || '#'}">${trackTitle}</a> by ${artist} is licensed under <a href="${licenseUrl || 'https://creativecommons.org/licenses/by-sa/3.0/'}">CC BY-SA 3.0</a>. Source: ${source}`;
          licenseInfo = 'Creative Commons Attribution-ShareAlike 3.0 License - You must give appropriate credit, provide a link to the license, and indicate if changes were made. If you remix, transform, or build upon the material, you must distribute your contributions under the same license.';
          break;
        
        case 'CC0':
          attributionText = `${trackTitle} by ${artist} is in the public domain (CC0). Source: ${source}`;
          attributionHtml = `<a href="${sourceUrl || '#'}">${trackTitle}</a> by ${artist} is in the public domain (<a href="${licenseUrl || 'https://creativecommons.org/publicdomain/zero/1.0/'}">CC0</a>). Source: ${source}`;
          licenseInfo = 'Creative Commons Zero (CC0) - This work has been dedicated to the public domain. You can use it freely without attribution, though attribution is appreciated.';
          break;
        
        default:
          attributionText = `${trackTitle} by ${artist}. Source: ${source}. License: ${license}`;
          attributionHtml = `<a href="${sourceUrl || '#'}">${trackTitle}</a> by ${artist}. Source: ${source}. License: <a href="${licenseUrl || '#'}">${license}</a>`;
          licenseInfo = 'Please check the specific license terms on the original source website.';
      }

      // Generate usage guidelines
      const usageGuidelines = {
        attribution: {
          required: license !== 'CC0',
          text: attributionText,
          html: attributionHtml
        },
        commercial: {
          allowed: ['CC BY 4.0', 'CC BY-SA 3.0', 'CC0'].includes(license),
          note: license === 'CC0' ? 'Commercial use is allowed without restrictions.' : 'Commercial use is allowed with proper attribution.'
        },
        modification: {
          allowed: ['CC BY 4.0', 'CC BY-SA 3.0', 'CC0'].includes(license),
          note: license === 'CC BY-SA 3.0' ? 'Modifications are allowed, but you must share under the same license.' : 'Modifications are allowed with proper attribution.'
        }
      };

      return res.status(200).json({
        success: true,
        attribution: {
          text: attributionText,
          html: attributionHtml,
          license: license,
          licenseUrl: licenseUrl,
          licenseInfo: licenseInfo,
          source: source,
          sourceUrl: sourceUrl
        },
        usage: usageGuidelines,
        track: {
          title: trackTitle,
          artist: artist,
          id: trackId
        }
      });

    } catch (error) {
      console.error('Error generating attribution:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate attribution',
        message: 'Unable to generate attribution text at this time'
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
