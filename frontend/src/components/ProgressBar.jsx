import React from "react";
import styled from "styled-components";

const ProgressBarContainer = styled.section`
  height: 40px;
  width: 60%;
  background-color: #ffffff;
  border-radius: 50px;
  border: solid black 4px;
  overflow: hidden;
  margin: 5rem 0;

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

const DefaultText = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 720px) {
    font-size: 0.7rem;
  }
`;

export default function ProgressBar({ bgcolor, completed = 0 }) {
  return (
    <ProgressBarContainer aria-label="Progress bar">
      {completed === 0 ? (
        <DefaultText>
          <span>Start Your Journey Now</span>
        </DefaultText>
      ) : (
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
      )}
    </ProgressBarContainer>
  );
}
