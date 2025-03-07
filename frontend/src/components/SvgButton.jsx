export default function SvgButton({ svgLabel, onClick }) {
  return (
    <button className="btn" aria-label={svgLabel} onClick={onClick}>
      <img src={svgLabel} />
    </button>
  );
}
