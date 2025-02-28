import StandingGuy from "../assets/illustration.svg";
import Banners from "../assets/Banners.svg";
import ArrowIcon from "../assets/arrow.svg";
import IEEELogo from "../assets/IEEE.svg";
import InstagramLogo from "../assets/Instagram.svg";
import TwitterLogo from "../assets/Twitter.svg";
import DiscordLogo from "../assets/Discord.svg";
import GithubLogo from "../assets/github.svg";
import LinkedinLogo from "../assets/Linkedin.svg";
import GoogleLogo from "../assets/google.svg";

import "./SignUpPage.css";
import useUserStore from "../stores/useUserStore";
import { useState } from "react";

export default function SignUpPage() {
  const { login, loading } = useUserStore();
  const [disabled, setDisabled] = useState(false);

  const handleLogin = async () => {
    setDisabled(true);
    await login();
    setDisabled(false);
  };
  return (
    <>
      <div className="signup-container">
        <header>
          <img src={IEEELogo} alt="IEEE Logo" className="ieee-logo" />

          <div>
            <h2>IEEE ENROLLMENTS</h2>
          </div>
        </header>

        <section className="signup-box">
          <p>2024-25</p>
          <button
            className="google-signin"
            onClick={handleLogin}
            disabled={loading || disabled}
          >
            {!loading && <img src={GoogleLogo} alt="google logo" />}
            {loading ? "LOGGING IN..." : "SIGN IN WITH GOOGLE"}
          </button>
        </section>

        <img
          src={StandingGuy}
          alt="Illustration of a person standing"
          className="standing-guy"
        />
        <img src={ArrowIcon} alt="Arrow icon" className="arrow-icon" />

        <img src={Banners} alt="Our Banners" className="banners" />
      </div>
      <footer>
        <ul className="social-links">
          <li>
            <a href="#">
              <img src={InstagramLogo} alt="Instagram Logo" />
            </a>
          </li>
          <li>
            <a href="#">
              <img src={TwitterLogo} alt="Twitter Lgoo" />
            </a>
          </li>
          <li>
            <a href="#">
              <img src={GithubLogo} alt="Github Logo" />
            </a>
          </li>
          <li>
            <a href="#">
              <img src={DiscordLogo} alt="Discord Logo" />
            </a>
          </li>
          <li>
            <a href="#">
              <img src={LinkedinLogo} alt="Linkedin Logo" />
            </a>
          </li>
        </ul>
      </footer>
    </>
  );
}
