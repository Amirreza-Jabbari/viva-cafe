import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // 1. Authenticate
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, process.env.ADMIN_PASSWORD);
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Validate input (img & description optional)
  let { id, title, category, price, img = '', description = '' } = req.body;
  price = Number(price); // coerce
  if (!title || !category || isNaN(price)) {
    return res.status(400).json({ error: 'Missing required fields: title, category, price' });
  }

  try {
    // 3. Fetch current menu.json
    const raw = await fetch(
      `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/data/menu.json`
    );
    if (!raw.ok) {
      console.error('Failed to fetch raw menu.json:', await raw.text());
      return res.status(500).json({ error: 'Failed to fetch existing menu' });
    }
    const menu = await raw.json();

    // 4. Modify array
    let updated;
    if (id) {
      id = Number(id);
      updated = menu.map(item =>
        item.id === id
          ? { id, title, category, price, img, description }
          : item
      );
    } else {
      const newId = Math.max(0, ...menu.map(i => i.id)) + 1;
      updated = [...menu, { id: newId, title, category, price, img, description }];
    }

    // 5. Get file SHA
    const shaRes = await fetch(
      `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/menu.json`,
      { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!shaRes.ok) {
      console.error('Failed to fetch file metadata:', await shaRes.text());
      return res.status(500).json({ error: 'Could not fetch file metadata' });
    }
    const { sha } = await shaRes.json();

    // 6. Commit updated JSON
    const commitRes = await fetch(
      `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/menu.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: id ? `Update item #${id}` : 'Add new menu item',
          content: Buffer.from(JSON.stringify(updated, null, 2)).toString('base64'),
          sha
        })
      }
    );
    if (!commitRes.ok) {
      const errText = await commitRes.text();
      console.error('GitHub commit failed:', errText);
      return res.status(500).json({ error: 'Failed to update menu.json' });
    }

    // 7. Respond success
    return res.status(200).json({
      success: true,
      message: id
        ? `Item #${id} updated successfully`
        : 'New menu item added successfully'
    });

  } catch (err) {
    console.error('Unexpected error in update-menu:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
