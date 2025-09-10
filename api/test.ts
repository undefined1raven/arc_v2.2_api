function handler(req, res) {
  return res.status(200).json({ name: "John Doe" });
}

export default handler;
