function validateRTDBPath(path) {
  if (path === undefined || typeof path !== "string") {
    throw new Error("Path must be a string");
  } else {
    path = path.replaceAll(".", "1");
    path = path.replaceAll("#", "2");
    path = path.replaceAll("$", "3");
    path = path.replaceAll("\\", "4");
    path = path.replaceAll("[", "5");
    path = path.replaceAll("]", "6");
    path = path.replaceAll("/", "7");
    return path;
  }
}

export { validateRTDBPath };
