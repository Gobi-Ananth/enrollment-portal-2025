import { Navigate, useLocation } from "react-router-dom";
import styled from "styled-components";

const TextColor = [
  { label: "Completed", Color: "#2AC080" },
  { label: "Upcoming", Color: "#FDE82D" },
  { label: "Missed", Color: "#F03F3F" },
];

const FallBackContainer = styled.section`
  .fallback-window {
    font-size: 3.5rem;
    color: ${(props) => props.$textColor};
  }

  @media (max-width: 720px) {
    .fallback-window {
      font-size: 2.4rem;
    }
  }
`;

export default function FallBack() {
  const location = useLocation();

  if (!location.state?.allowed) {
    return <Navigate to="/" />;
  }

  const fallbackText = location.state?.fallbackText || "Nigga";
  const color =
    TextColor.find((item) => item.label === fallbackText)?.Color || "#000";

  return (
    <FallBackContainer $textColor={color}>
      <div className="fallback-window">{fallbackText}</div>
    </FallBackContainer>
  );
}
