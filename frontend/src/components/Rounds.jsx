import { useEffect, useState } from "react";

import SvgButton from "./SvgButton";

import "./Rounds.css";

const roundsData = [
  { id: 0, label: "Round 0" },
  { id: 1, label: "Round 1" },
  { id: 2, label: "Round 2" },
  { id: 3, label: "Round 3" },
];

export default function Rounds() {
  const [currentRound, setCurrentRound] = useState(0);
  const [progress, setProgress] = useState(0);

  //Gobi the data fethcing function
  useEffect(() => {
    fetch("/api/user/")
      .then((res) => res.json())
      .then((data) => {
        setCurrentRound(data.currentRound);
        setProgress((data.currentRound + 1) * 25);
      })
      .catch((err) => console.error("Error fetching round progress:", err));
  }, []);

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
    <main className="container">
      <section className="rounds">
        {roundsData.map((round, index) => (
          <div key={round.id} className="round">
            <SvgButton svgLabel={getFolderIcon(index)} />
            <p>{round.label}</p>
          </div>
        ))}
      </section>

      <progress className="progress-bar" value="25" max="100">
        START YOUR JOURNEY NOW
      </progress>
    </main>
  );
}
