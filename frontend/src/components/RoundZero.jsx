import { useState, useEffect } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./RoundZero.css";
import LeftOption from "../assets/LeftOptions.svg";
import RightOption from "../assets/RightOption.svg";
import axiosInstance from "../lib/axios.js";
import useUserStore from "../stores/useUserStore.js";

const predefinedRandomQuestions = [
  {
    Qno: 1,
    label:
      "Two key members of your team are refusing to collaborate because of personal differences. The project deadline is approaching, and their lack of cooperation affects productivity. How would you handle this situation?",
  },
  {
    Qno: 2,
    label:
      "During a live online coding competition your team hosts, the platform crashes, preventing participants from submitting their solutions. Participants are frustrated and flooding the chat with complaints. How would you communicate and handle the crisis?",
  },
  {
    Qno: 3,
    label:
      "You are caught in a disagreement between two board members. Meanwhile, your faculty coordinator, who has a short temper and a history of being difficult to deal with, is calling and asking for someone to speak to him. How would you manage this situation?",
  },
];

const baseQuestions = [
  { id: "contactNo", type: "text", label: "Phone Number", required: true },
  {
    id: "githubProfile",
    type: "text",
    label: "GitHub Profile (Optional)",
    required: false,
  },
  {
    id: "projectLink",
    type: "text",
    label: "Previous Project Link (Optional)",
    required: false,
  },
  {
    id: "projectText",
    type: "textarea",
    label: "Description (If link provided)",
    required: false,
  },
  {
    id: "domain",
    type: "multi-select",
    label: "Select your domains(Min: 1, Max: 2)",
    required: true,
    options: [
      "APP DEV",
      "WEB DEV",
      "ELECTRONICS",
      "AR VR",
      "VIDEO EDITING",
      "MACHINE LEARNING",
      "DESIGN",
      "CYBER SECURITY",
      "BLOCK CHAIN",
      "COMPETITIVE CODING",
      "GAME DEV",
    ],
    min: 1,
    max: 2,
  },
  {
    id: "answer1",
    type: "text",
    label:
      "What's one technology or software you currently know/have experience in? (No prior experience is also valid.)",
    required: true,
  },
  {
    id: "answer2",
    type: "textarea",
    label:
      "What's one technology or software you want to explore in the future",
    required: true,
  },
  {
    id: "answer3",
    type: "textarea",
    label:
      "Have you participated in any hackathons/competitions in the past? If yes, describe your experience.",
    required: false,
  },
  {
    id: "answer4",
    type: "textarea",
    label: "Have you done any projects previously? (Yes/No)",
    required: true,
  },
  {
    id: "answer5",
    type: "textarea",
    label:
      "If yes, what was your experience doing the project? What problems did you face, and how did you solve them?",
    required: false,
  },
  { id: "managementAnswer", type: "textarea", label: "", required: true },
];

let managementQuestion;

export default function RoundZero() {
  const [formStarted, setFormStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(
    () => JSON.parse(sessionStorage.getItem("formAnswers")) || {}
  );
  const [formCompleted, setFormCompleted] = useState(false);
  const [errors, setErrors] = useState({});
  const [questions, setQuestions] = useState(baseQuestions);
  const [randomQuestionSet, setRandomQuestionSet] = useState(false);
  const { user, checkUserAuth } = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem("formAnswers", JSON.stringify(answers));
  }, [answers]);

  if (!location.state?.allowed || user.Round0Status === "completed") {
    return <Navigate to="/" />;
  }

  const handleStart = () => {
    setFormStarted(true);

    if (!randomQuestionSet) {
      const randomQ =
        predefinedRandomQuestions[
          Math.floor(Math.random() * predefinedRandomQuestions.length)
        ];
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === "managementAnswer"
            ? { ...q, label: randomQ.label, type: "textarea" }
            : q
        )
      );
      managementQuestion = randomQ.Qno;
      setRandomQuestionSet(true);
    }
  };

  const handleNext = () => {
    let newErrors = { ...errors };
    const question = questions[currentQuestion];
    if (question.required) {
      if (question.type === "multi-select") {
        const selected = answers[question.id] || [];
        if (selected.length < question.min) {
          newErrors[
            question.id
          ] = `Please select at least ${question.min} option.`;
          setErrors(newErrors);
          return;
        }
      } else if (!answers[question.id]) {
        newErrors[question.id] = "Mandatory Question";
        setErrors(newErrors);
        return;
      }
    }
    delete newErrors[question.id];
    setErrors(newErrors);

    if (question.id === "contactNo" && answers["contactNo"]) {
      const phoneRegex = /^[6789]\d{9}$/;
      if (!phoneRegex.test(answers["contactNo"])) {
        newErrors["contactNo"] = "Invalid phone number.";
        setErrors(newErrors);
        return;
      }
    }

    if (question.id === "githubProfile" && answers["githubProfile"]) {
      const phoneRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/?$/;
      if (!phoneRegex.test(answers["githubProfile"])) {
        newErrors["githubProfile"] = "Invalid phone number.";
        setErrors(newErrors);
        return;
      }
    }

    if (currentQuestion === questions.length - 1) {
      setFormCompleted(true);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  };

  const handleChange = (e) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: e.target.value,
    });
    setErrors({ ...errors, [questions[currentQuestion].id]: "" });
  };

  const handleMultiSelect = (option) => {
    const selected = answers[questions[currentQuestion].id] || [];
    if (selected.includes(option)) {
      setAnswers({
        ...answers,
        [questions[currentQuestion].id]: selected.filter((o) => o !== option),
      });
    } else if (selected.length < questions[currentQuestion].max) {
      setAnswers({
        ...answers,
        [questions[currentQuestion].id]: [...selected, option],
      });
    } else {
      setErrors({
        ...errors,
        [questions[currentQuestion].id]: "You can select up to 2 options only.",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      answers["managementQuestion"] = managementQuestion;
      const response = await axiosInstance.post("/user/r0-submission", answers);
      toast.success(response.data.message);
      checkUserAuth();
      navigate("/");
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.message || "An error occurred");
      } else if (err.request) {
        toast.error("No response from server");
      } else {
        toast.error("Round 0 submission failed");
      }
    }
    sessionStorage.clear();
  };

  return (
    <>
      {!formStarted ? (
        <button className="s-button" onClick={handleStart}>
          START
        </button>
      ) : formCompleted ? (
        <>
          <button className="s-button" onClick={handleSubmit}>
            Submit
          </button>
          <button className="review" onClick={() => setFormCompleted(false)}>
            Review
          </button>
        </>
      ) : (
        <div className="form-container">
          <div
            className={`question-box card ${
              questions[currentQuestion].type === "multi-select"
                ? "multi-select-question"
                : questions[currentQuestion].type === "textarea"
                ? "textarea-question"
                : "text-question"
            }`}
          >
            <p className="question-text">
              {questions[currentQuestion].label}
              {questions[currentQuestion].required && (
                <span className="required-indicator">*</span>
              )}
            </p>

            {questions[currentQuestion].type === "multi-select" ? (
              <>
                <div className="options-container">
                  {questions[currentQuestion].options.map((option) => (
                    <button
                      key={option}
                      className={`option-button ${
                        answers[questions[currentQuestion].id]?.includes(option)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleMultiSelect(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors[questions[currentQuestion].id] && (
                  <p className="error-text">
                    {errors[questions[currentQuestion].id]}
                  </p>
                )}
              </>
            ) : questions[currentQuestion].type === "textarea" ? (
              <>
                <textarea
                  className="textarea-input"
                  value={answers[questions[currentQuestion].id] || ""}
                  onChange={handleChange}
                  maxLength={500}
                ></textarea>
                {errors[questions[currentQuestion].id] && (
                  <p className="error-tex">
                    {errors[questions[currentQuestion].id]}
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  className={`text-input ${
                    questions[currentQuestion].required ? "required" : ""
                  }`}
                  type="text"
                  value={answers[questions[currentQuestion].id] || ""}
                  onChange={handleChange}
                  maxLength={500}
                  aria-required={questions[currentQuestion].required}
                  aria-invalid={!!errors[questions[currentQuestion].id]}
                />
                {errors[questions[currentQuestion].id] && (
                  <p className="error-text">
                    {errors[questions[currentQuestion].id]}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="navigation-buttons">
            <button
              className="btn"
              onClick={handlePrev}
              disabled={currentQuestion === 0}
            >
              <img src={LeftOption} alt="Previous Question Button" />
            </button>
            <button className="btn" onClick={handleNext}>
              <img src={RightOption} alt="Next Question Button" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
