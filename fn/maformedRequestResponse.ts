function malformedRequestResponse(res) {
  return res.status(400).json({ error: "Malformed request" });
}

function errorResponse(res) {
  return res.status(500).json({ error: "Someting went wrong" });
}

export { malformedRequestResponse, errorResponse };
