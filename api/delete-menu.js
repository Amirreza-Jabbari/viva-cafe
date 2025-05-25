import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Authenticate
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, process.env.ADMIN_PASSWORD);
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Parse & validate ID from query
  const id = Number(req.query.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid or missing id' });
  }

  try {
    // 3. Fetch current menu.json
    const raw = await fetch(
      `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/data/menu.json`
    );
    if (!raw.ok) {
      console.error('Failed to fetch menu.json:', await raw.text());
      return res.status(500).json({ error: 'Could not fetch menu' });
    }
    const menu = await raw.json();

    // 4. Remove the item
    const updated = menu.filter(item => item.id !== id);

    // 5. Get SHA for existing file
    const shaRes = await fetch(
      `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/menu.json`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );
    if (!shaRes.ok) {
      console.error('Failed to get file metadata:', await shaRes.text());
      return res.status(500).json({ error: 'Could not fetch file metadata' });
    }
    const { sha } = await shaRes.json();

    // 6. Commit the updated file
    const commitRes = await fetch(
      `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/menu.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Delete item #${id}`,
          content: Buffer.from(JSON.stringify(updated, null, 2)).toString('base64'),
          sha
        })
      }
    );
    if (!commitRes.ok) {
      console.error('GitHub commit failed:', await commitRes.text());
      return res.status(500).json({ error: 'Failed to update menu' });
    }

    // 7. Return success
    return res.status(200).json({ success: true, message: `Item #${id} deleted` });
  } catch (err) {
    console.error('Unexpected error in delete-menu:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
