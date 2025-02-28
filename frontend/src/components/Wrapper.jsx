import SvgButton from "./SvgButton";

import "./Wrapper.css";

import Minimize from "../assets/minmize.svg";
import Maximize from "../assets/maximize.svg";
import Close from "../assets/close.svg";
import Right from "../assets/Right.svg";
import Left from "../assets/Left.svg";
import Lock from "../assets/lock.svg";
import Hamburger from "../assets/Hamburger.svg";
import Plus from "../assets/Plus.svg";
import Tab from "../assets/Tab.svg";

export default function Wrapper({ title, children }) {
  return (
    <main className="wrapper">
      <section className="upper-nav">
        <div className="tab">
          <object data={Tab} type="image/svg+xml"></object>
          <object data={Plus} type="image/svg+xml"></object>
        </div>
        <div className="window-controls">
          <SvgButton svgLabel={Minimize} />
          <SvgButton svgLabel={Maximize} />
          <SvgButton svgLabel={Close} />
        </div>
      </section>
      <section className="lower-nav">
        <div className="nav-controls">
          <SvgButton svgLabel={Left} />
          <SvgButton svgLabel={Right} />
        </div>
        <div className="address-bar">
          <object data={Lock} type="image/svg+xml"></object>
          <h3 className="text">{title}</h3>
        </div>
        <div className="nav-controls">
          <SvgButton svgLabel={Hamburger} />
        </div>
      </section>

      <section>{children}</section>
    </main>
  );
}
