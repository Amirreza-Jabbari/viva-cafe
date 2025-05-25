import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const GITHUB_API = 'https://api.github.com';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  // Auth
  const token = req.headers.authorization?.split(' ')[1];
  try { jwt.verify(token, process.env.ADMIN_PASSWORD); }
  catch { return res.status(401).end(); }

  const { id, title, category, price, img, description } = req.body;
  if (!title || !category || price == null || !img) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // 1. Fetch current menu.json
  const raw = await fetch(
    `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/data/menu.json`
  );
  const menu = await raw.json();

  // 2. Modify array
  let updated;
  if (id) {
    updated = menu.map(item =>
      item.id === +id
        ? { id: +id, title, category, price: +price, img, description }
        : item
    );
  } else {
    const newId = Math.max(0, ...menu.map(i => i.id)) + 1;
    updated = [
      ...menu,
      { id: newId, title, category, price: +price, img, description }
    ];
  }

  // 3. Get SHA of existing file
  const shaResponse = await fetch(
    `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/menu.json`,
    {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
    }
  );

  if (!shaResponse.ok) {
    console.error('Failed to fetch file SHA from GitHub:', await shaResponse.text());
    return res.status(500).json({ error: 'Could not fetch file metadata' });
  }

  const shaData = await shaResponse.json();
  const sha = shaData.sha;


  // 4. Commit updated JSON
  const commitResponse = await fetch(
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

  if (!commitResponse.ok) {
    const errorText = await commitResponse.text();
    console.error('GitHub commit failed:', errorText);
    return res.status(500).json({ error: 'Failed to update GitHub file' });
  }

};
