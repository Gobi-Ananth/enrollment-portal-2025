import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "../stores/useUserStore.js";

import SvgButton from "./SvgButton";
import ProgressBar from "./ProgressBar";

import "./Rounds.css";

const roundsData = [
  { id: 0, label: "ROUND 0", bgColor: "#24B577" },
  { id: 1, label: "ROUND 1", bgColor: "#FDE82D" },
  { id: 2, label: "ROUND 2", bgColor: "#FF9F17" },
  { id: 3, label: "ROUND 3", bgColor: "#F03F3F" },
];

export default function Rounds() {
  const [currentRound, setCurrentRound] = useState(0);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const { user } = useUserStore();

  useEffect(() => {
    setCurrentRound(user.currentRound);
    setProgress(user.currentRound * 25);
  }, [user.currentRound]);

  const getFolderIcon = (index) => {
    if (currentRound === 3 && user.round3Status === "complete") {
      return `/assets/Rounds/round${index}-completed.svg`;
    } else if (index < currentRound) {
      return `/assets/Rounds/round${index}-completed.svg`;
    } else if (index === currentRound) {
      return `/assets/Rounds/round${index}-progress.svg`;
    } else {
      return `/assets/Rounds/round${index}-locked.svg`;
    }
  };

  const checkCurrentRound = (index) => index === currentRound;
  const liveRound = Number(import.meta.env.VITE_LIVE_ROUND);

  const handleRoundClick = (index) => {
    const roundStatuses = [
      user.round0Status,
      user.round1Status,
      user.round2Status,
      user.round3Status,
    ];

    if (roundStatuses[index] === "completed") {
      navigate(index === 0 || index === 3 ? "/fallback" : "/task", {
        state: { allowed: true, fallbackText: "Completed" },
      });
      return;
    }

    if (currentRound === index && liveRound === index - 1) {
      navigate("/fallback", {
        state: { allowed: true, fallbackText: "Upcoming" },
      });
      return;
    }

    if (index <= currentRound && currentRound < liveRound) {
      navigate("/fallback", {
        state: { allowed: true, fallbackText: "Missed" },
      });
      return;
    }

    if (checkCurrentRound(index)) {
      if (!user.slot && index !== 0) {
        navigate("/slots", { state: { allowed: true } });
        return;
      }
      if (user.slot && index !== 0) {
        navigate("/meet", { state: { allowed: true } });
        return;
      }
      if (index === 0 && user.round0Status === "pending") {
        navigate("/round0", { state: { allowed: true } });
      }
    }
  };

  return (
    <>
      <section className="rounds">
        {roundsData.map((round, index) => (
          <div key={round.id} className="round">
            <SvgButton
              svgLabel={getFolderIcon(index)}
              onClick={() => handleRoundClick(index)}
            />
            <p>{round.label}</p>
          </div>
        ))}
      </section>
      <ProgressBar
        bgcolor={
          currentRound > 0 ? roundsData[currentRound - 1].bgColor : "#FFF"
        }
        completed={progress}
      />
    </>
  );
}
