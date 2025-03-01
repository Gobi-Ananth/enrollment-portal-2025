import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import SignUpPage from "./components/SignUpPage";
import Wrapper from "./components/Wrapper";
import Rounds from "./components/Rounds";
import { Toaster } from "react-hot-toast";
import useUserStore from "./stores/useUserStore.js";
import { useEffect } from "react";

export default function App() {
  const { user, checkUserAuth } = useUserStore();

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={!user ? <SignUpPage /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={
              user ? (
                <Wrapper title="https://enrollments.ieeevit.org/">
                  <Rounds />
                </Wrapper>
              ) : (
                <SignUpPage />
              )
            }
          />
        </Routes>
      </Router>
    </>
  );
}
