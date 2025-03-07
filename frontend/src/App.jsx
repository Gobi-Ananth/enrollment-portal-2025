import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import SignUpPage from "./components/SignUpPage.jsx";
import Wrapper from "./components/Wrapper.jsx";
import Rounds from "./components/Rounds.jsx";
import RoundZero from "./components/RoundZero.jsx";
import { Toaster } from "react-hot-toast";
import useUserStore from "./stores/useUserStore.js";
import { useEffect } from "react";
import Interview from "./components/Interview.jsx";
import SlotWindow from "./components/SlotWindow.jsx";
import FallBack from "./components/FallBack.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

export default function App() {
  const { user, checkUserAuth, checkingUserAuth } = useUserStore();

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  if (checkingUserAuth)
    return (
      <Wrapper>
        <LoadingScreen />
      </Wrapper>
    );

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
          <Route
            path="/fallback"
            element={
              user ? (
                <Wrapper title="https://enrollments.ieeevit.org/fallback">
                  <FallBack />
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
