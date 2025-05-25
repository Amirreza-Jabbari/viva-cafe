// /api/get-menu.js
export default async function handler(req, res) {
  // Disable all caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    const raw = await fetch(
      `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/data/menu.json`
    );
    const menu = await raw.json();
    res.status(200).json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
}
