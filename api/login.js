import jwt from 'jsonwebtoken';

export default (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, process.env.ADMIN_PASSWORD, { expiresIn: '2h' });
    res.status(200).json({ token });
  } else {
    res.status(401).end();
  }
};
