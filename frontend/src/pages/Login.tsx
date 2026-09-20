import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  GraduationCap,
  Eye,
  EyeOff,
  UserRound,
  UsersRound,
} from "lucide-react";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] =
    useState(false);

  const [role, setRole] =
    useState<"student" | "faculty">("student");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    // ===================================================
    // SIGNUP VALIDATION
    // ===================================================

    if (
      isSignup &&
      password !== confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {

      // =================================================
      // SIGNUP
      // =================================================

      if (isSignup) {

        const response = await fetch(
          "http://localhost:8000/signup",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: name.trim(),
              email: email.trim(),
              password: password,
              role: role,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to create account."
          );
        }

        // =================================================
        // SAVE USER
        // =================================================

        localStorage.setItem(
          "campusconnect_user",
          JSON.stringify(data.user)
        );

        // =================================================
        // SAVE JWT TOKEN
        // =================================================

        localStorage.setItem(
          "campusconnect_token",
          data.access_token
        );

        // =================================================
        // NAVIGATE ACCORDING TO ROLE
        // =================================================

        if (
          data.user.role === "student"
        ) {
          navigate("/student");
        } else {
          navigate("/faculty");
        }

        return;
      }


      // =================================================
      // LOGIN
      // =================================================

      const response = await fetch(
        "http://localhost:8000/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Invalid email or password."
        );
      }


      // =================================================
      // CHECK ROLE
      // =================================================

      if (
        data.user.role !== role
      ) {
        throw new Error(
          `This account is registered as ${data.user.role}.`
        );
      }


      // =================================================
      // SAVE USER
      // =================================================

      localStorage.setItem(
        "campusconnect_user",
        JSON.stringify(data.user)
      );


      // =================================================
      // SAVE JWT TOKEN
      // =================================================

      localStorage.setItem(
        "campusconnect_token",
        data.access_token
      );


      // =================================================
      // NAVIGATE
      // =================================================

      if (
        data.user.role === "student"
      ) {
        navigate("/student");
      } else {
        navigate("/faculty");
      }

    } catch (error) {

      console.error(
        "Authentication error:",
        error
      );

      // =================================================
      // BROWSER / NETWORK ERROR
      // =================================================

      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {

        setError(
          "Cannot connect to CampusConnect server. Please make sure the FastAPI backend is running."
        );

      }

      // =================================================
      // BACKEND ERROR
      // =================================================

      else if (
        error instanceof Error
      ) {

        setError(
          error.message
        );

      }

      // =================================================
      // UNKNOWN ERROR
      // =================================================

      else {

        setError(
          "Something went wrong. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // SWITCH LOGIN / SIGNUP
  // =====================================================

  const switchMode = () => {

    setIsSignup(!isSignup);

    setError("");

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setShowPassword(false);
    setShowConfirmPassword(false);
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="login-page">

      {/* =================================================
          LEFT BRANDING
      ================================================= */}

      <section className="login-brand">

        <div className="brand-content">

          <div className="brand-icon">
            <GraduationCap size={34} />
          </div>

          <h1>
            CampusConnect AI
          </h1>

          <p>
            Your campus, connected.
          </p>

          <div className="brand-description">

            <p>
              Your intelligent college
              knowledge assistant for
              finding information,
              exploring campus resources,
              and staying connected.
            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          LOGIN SECTION
      ================================================= */}

      <section className="login-section">

        <div className="login-card">

          {/* =================================================
              MOBILE LOGO
          ================================================= */}

          <div className="mobile-logo">

            <div className="brand-icon">
              <GraduationCap size={30} />
            </div>

            <h1>
              CampusConnect AI
            </h1>

          </div>


          {/* =================================================
              HEADING
          ================================================= */}

          <div className="login-heading">

            <h2>
              {isSignup
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p>
              {isSignup
                ? "Join your campus knowledge community"
                : "Sign in to continue to CampusConnect AI"}
            </p>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}


          {/* =================================================
              ROLE
          ================================================= */}

          <div className="role-section">

            <label>
              {isSignup
                ? "I am a"
                : "Login as"}
            </label>

            <div className="role-buttons">

              {/* STUDENT */}

              <button
                type="button"
                className={`role-button ${
                  role === "student"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setRole("student");
                  setError("");
                }}
              >

                <UserRound size={19} />

                <span>
                  Student
                </span>

              </button>


              {/* FACULTY */}

              <button
                type="button"
                className={`role-button ${
                  role === "faculty"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setRole("faculty");
                  setError("");
                }}
              >

                <UsersRound size={19} />

                <span>
                  Faculty
                </span>

              </button>

            </div>

          </div>


          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
          >

            {/* NAME */}

            {isSignup && (
              <div className="form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  required
                />

              </div>
            )}


            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                College Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-input">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}

                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            {isSignup && (
              <div className="form-group">

                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <div className="password-input">

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}

                  </button>

                </div>

              </div>
            )}


            {/* FORGOT PASSWORD */}

            {!isSignup && (
              <div className="forgot-password">

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Password reset will be added later."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>
            )}


            {/* SUBMIT */}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >

              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Sign In"}

            </button>

          </form>


          {/* =================================================
              SWITCH MODE
          ================================================= */}

          <div className="switch-mode">

            <span>
              {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isSignup
                ? "Sign in"
                : "Sign up"}
            </button>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <p className="login-footer">
            CampusConnect AI • College
            Knowledge Assistant
          </p>

        </div>

      </section>

    </div>
  );
}