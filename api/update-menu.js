import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const GITHUB_API = 'https://api.github.com';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // 1. Authenticate
  const token = req.headers.authorization?.split(' ')[1];
  try {
    jwt.verify(token, process.env.ADMIN_PASSWORD);
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Validate input
  const { id, title, category, price, img, description } = req.body;
  if (!title || !category || price == null || !img) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 3. Fetch current menu.json from raw GitHub
    const raw = await fetch(
      `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/data/menu.json`
    );

    if (!raw.ok) {
      console.error('Failed to fetch raw menu.json:', await raw.text());
      return res.status(500).json({ error: 'Failed to fetch existing menu' });
    }

    const menu = await raw.json();

    // 4. Modify the array
    let updated;
    if (id) {
      updated = menu.map(item =>
        item.id === +id
          ? { id: +id, title, category, price: +price, img, description }
          : item
      );
    } else {
      const newId = Math.max(0, ...menu.map(i => i.id)) + 1;
      updated = [...menu, { id: newId, title, category, price: +price, img, description }];
    }

    // 5. Get SHA of current file from GitHub
    const shaResponse = await fetch(
      `${GITHUB_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/menu.json`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    if (!shaResponse.ok) {
      console.error('Failed to fetch file SHA from GitHub:', await shaResponse.text());
      return res.status(500).json({ error: 'Could not fetch file metadata' });
    }

    const shaData = await shaResponse.json();
    const sha = shaData.sha;

    // 6. Commit updated JSON file to GitHub
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

    // 7. Return success response
    return res.status(200).json({
      success: true,
      message: id ? `Item #${id} updated successfully` : 'New menu item added successfully'
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
