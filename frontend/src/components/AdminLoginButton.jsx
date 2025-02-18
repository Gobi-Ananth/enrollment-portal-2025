import axios from "axios";
import { auth, provider, signInWithPopup } from "../config/firebase.config.js";
import admins from "../../admin.js";

const AdminLoginButton = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const admin = result.user;
      if (!admin.email.endsWith(import.meta.env.VITE_EMAIL_DOMAIN)) {
        await auth.signOut();
        alert("Use VIT email");
        return;
      } else if (!admins.includes(admin.email)) {
        await auth.signOut();
        alert("Unauthorized");
        return;
      }
      const token = await admin.getIdToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/login`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 201) {
        alert("Login successful");
        console.log(response.data);
      } else if (response.status === 200) {
        alert("Login successful");
        console.log(response.data);
      }
    } catch (err) {
      if (err.response) {
        alert(err.response.data?.message || "Error occurred");
      } else if (err.request) {
        alert("No response from server");
      } else {
        alert("Login failed");
      }
    }
  };
  return (
    <button
      onClick={handleLogin}
      className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 border-b-4 border-gray-900 hover:border-gray-700 rounded"
    >
      SIGN IN WITH GOOGLE
    </button>
  );
};

export default AdminLoginButton;
