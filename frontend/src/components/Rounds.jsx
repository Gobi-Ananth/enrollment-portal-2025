import { useEffect, useState } from "react";
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
  const [progress, setProgress] = useState(25);

  const { user } = useUserStore();

  useEffect(() => {
    setCurrentRound(user.currentRound);
    setProgress((user.currentRound + 1) * 25);
  }, [user.currentRound]);

  const getFolderIcon = (index) => {
    if (index < currentRound) {
      return `/assets/Rounds/round${index}-completed.svg`;
    } else if (index === currentRound) {
      return `/assets/Rounds/round${index}-progress.svg`;
    } else {
      return `/assets/Rounds/round${index}-locked.svg`;
    }
  };

  return (
    <>
      <section className="rounds">
        {roundsData.map((round, index) => (
          <div key={round.id} className="round">
            <SvgButton svgLabel={getFolderIcon(index)} />
            <p>{round.label}</p>
          </div>
        ))}
      </section>
      <ProgressBar
        bgcolor={roundsData[currentRound].bgColor}
        completed={progress}
      />
    </>
  );
}
