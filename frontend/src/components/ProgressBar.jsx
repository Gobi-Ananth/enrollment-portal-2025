export default function ProgressBar({ bgcolor, completed }) {
  const progressBarStyles = {
    height: "40px",
    width: "60%",
    backgroundColor: "#FFFFFF",
    borderRadius: "50px",
    border: "solid black 4px",
    overflow: "hidden",
    marginTop: "5rem",
  };

  const progressFillStyles = {
    height: "100%",
    width: `${completed}%`,
    backgroundColor: bgcolor,
    textAlign: "right",
    borderRadius: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingRight: "5px",
    color: "black",
    fontWeight: "bold",
    transition: "width 0.4s ease-in-out, background-color 0.3s ease-in-out",
  };

  const defaultStyles = {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <section aria-label="Progress bar" style={progressBarStyles}>
      {completed === 0 ? (
        <span style={defaultStyles}>Start Your Journey Now</span>
      ) : (
        <div
          style={progressFillStyles}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span>{`${completed}%`}</span>
        </div>
      )}
    </section>
  );
}
