import { useState, useEffect } from "react";
import "./LoadingScreen.css";

export default function LoadingScreen() {
  const [fillLevel, setFillLevel] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFillLevel((prev) => {
        if (prev >= 7) return 0;
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <div className="bar-container">
        <div className="segments-container">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className={`segment ${
                index <= fillLevel ? "filled-segment" : "empty-segment"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="bar-text">AN ADVENTURE AWAITS....</p>
    </>
  );
}
