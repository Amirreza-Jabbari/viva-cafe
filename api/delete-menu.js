import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const GITHUB_API = 'https://api.github.com';

export default async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).end();
  // Auth
  const token = req.headers.authorization?.split(' ')[1];
  try { jwt.verify(token, process.env.ADMIN_PASSWORD); }
  catch { return res.status(401).end(); }

  const id = +req.query.id;
  if (!id) return res.status(400).json({ error: 'Invalid ID' });

  // 1. Fetch current menu
  const raw = await fetch(
    `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/data/menu.json`
  );
  const menu = await raw.json();

  // 2. Remove item
  const updated = menu.filter(item => item.id !== id);

  // 3. Get SHA
  const { content: { sha } } = await fetch(
    `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/menu.json`,
    { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
  ).then(r => r.json());

  // 4. Commit
  await fetch(
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

  res.status(200).end();
};
