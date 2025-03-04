import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import SignUpPage from "./components/SignUpPage";
import Wrapper from "./components/Wrapper";
import Rounds from "./components/Rounds";
import RoundZero from "./components/RoundZero.jsx";
import { Toaster } from "react-hot-toast";
import useUserStore from "./stores/useUserStore.js";
import { useEffect } from "react";
import Interview from "./components/Interview.jsx";
import SlotWindow from "./components/SlotWindow.jsx";

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
          <Route
            path="/round0"
            element={
              user ? (
                <Wrapper title="https://enrollments.ieeevit.org/round0">
                  <RoundZero />
                </Wrapper>
              ) : (
                <SignUpPage />
              )
            }
          />
          <Route
            path="/slots"
            element={
              user ? (
                <Wrapper title="https://enrollments.ieeevit.org/slots">
                  <Interview />
                </Wrapper>
              ) : (
                <SignUpPage />
              )
            }
          />
          <Route
            path="/meet"
            element={
              user ? (
                <Wrapper title="https://enrollments.ieeevit.org/meet">
                  <SlotWindow />
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
