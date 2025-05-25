import fs from 'fs/promises';
import jwt from 'jsonwebtoken';

export default async (req, res) => {
  // public read
  if (req.method === 'GET' && !req.headers.authorization) {
    const data = await fs.readFile('data/menu.json', 'utf8');
    return res.status(200).json(JSON.parse(data));
  }
  // admin read
  const token = req.headers.authorization?.split(' ')[1];
  try {
    jwt.verify(token, process.env.ADMIN_PASSWORD);
    const data = await fs.readFile('data/menu.json', 'utf8');
    res.status(200).json(JSON.parse(data));
  } catch {
    res.status(401).end();
  }
};
