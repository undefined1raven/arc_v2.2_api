function malformedRequestResponse(res) {
  return res.status(400).json({ error: "Malformed request" });
}
export { malformedRequestResponse };
