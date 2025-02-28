export default function SvgButton({ svgLabel }) {
  return (
    <button className="btn" aria-label="Minimize">
      <object type="image/svg+xml" data={svgLabel}></object>
    </button>
  );
}
