import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/thedarkside" element={<AdminLoginPage />} />
      </Routes>
    </div>
  );
}

export default App;
