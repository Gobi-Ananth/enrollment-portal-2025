import admin from "../lib/firebase.js";

const authenticateFirebaseUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error(`Firebase Authentication Error: ${err.message}`);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authenticateFirebaseUser;
