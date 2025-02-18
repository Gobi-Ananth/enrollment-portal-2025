import axios from "axios";
import { auth, provider, signInWithPopup } from "../config/firebase.config.js";

const LoginButton = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user.email.endsWith(import.meta.env.VITE_EMAIL_DOMAIN)) {
        await auth.signOut();
        alert("Use VIT email");
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/user/login`,
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
      className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
    >
      SIGN IN WITH GOOGLE
    </button>
  );
};

export default LoginButton;
