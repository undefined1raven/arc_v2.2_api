function handler(req, res) {
  console.log("RDATA", req.body);
  return res.status(200).json({ name: "John Doe" });
}

export default handler;
