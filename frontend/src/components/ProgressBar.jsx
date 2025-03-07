import styled from "styled-components";

const ProgressBarContainer = styled.section`
  height: 40px;
  width: 60%;
  background-color: #ffffff;
  border-radius: 50px;
  border: solid black 4px;
  overflow: hidden;
  margin-top: 5rem;

  @media (max-width: 720px) {
    height: 25px;
    border-width: 2px;
    margin: 2rem 0;
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => props.$completed}%;
  background-color: ${(props) => props.$bgcolor};
  text-align: right;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 5px;
  color: black;
  font-weight: bold;
  transition: width 0.4s ease-in-out, background-color 0.3s ease-in-out;

  @media (max-width: 720px) {
    font-size: 10px;
  }
`;

export default function ProgressBar({ bgcolor, completed }) {
  return (
    <ProgressBarContainer aria-label="Progress bar">
      <ProgressFill
        $bgcolor={bgcolor}
        role="progressbar"
        aria-valuenow={completed}
        $completed={completed}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        {completed}%
      </ProgressFill>
    </ProgressBarContainer>
  );
}
