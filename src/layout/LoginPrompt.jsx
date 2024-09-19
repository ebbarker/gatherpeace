import { useContext, useEffect, useRef, useState } from "react";
import { supaClient } from "./supa-client";
import { Auth, ThemeSupa } from "@supabase/auth-ui-react";
import { UserContext } from "./App";
import Dialog from "./Dialog";

export default function LoginPrompt({ setShowLoginModal, showLoginModal }) {
  // const [showModal, setShowModal] = useState(true);
  const [authMode, setAuthMode] = useState("sign_in");
  const { session } = useContext(UserContext);
  const [errorMessage, setErrorMessage] = useState('');
  const [greetingScreen, setGreetingScreen] = useState(true);

  // const dialog = useRef(null);

  useEffect(() => {
    if (session?.user) {
      // setShowModal(false);
      setShowLoginModal(false);
    }
  }, [session, setShowLoginModal]);

  const setReturnPath = () => {
    localStorage.setItem("returnPath", window.location.pathname);
  };

  const handleAuthStateChange = (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      console.log('EVENT TRIGGERED');
      setShowLoginModal(false);
    }
  };

  const handleError = (error) => {
    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <>


      <Dialog
        open={showLoginModal}
        dialogStateChange={(open) => setShowLoginModal(open)}
        contents={
          greetingScreen ? (
          <div className="flex place-items-center login-buttons-container">
          <div
            className="login-button"
            id="login"
            onClick={() => {
              setAuthMode("sign_in");
              setGreetingScreen(false);
              setReturnPath();
            }}
          >
            <span className="please-text">Please</span>
            <a className="login" href="#">
              Login
            </a>
          </div>
          <span className="or-text"> or </span>
          <div
            className="sign-up-button"
            id="sign-up"
            onClick={() => {
              setAuthMode("sign_up");
              setGreetingScreen(false);
              setReturnPath();
            }}
          >
            <a className="signup-btn-txt" href="#">
              Sign up
            </a>
            <span className="to-participate-text">to participate.</span>
          </div>
        </div>
           ) : (
          <>
            <Auth
              providers={["google", "facebook", "twitter"]}
              supabaseClient={supaClient}
              appearance={{
                theme: ThemeSupa,
                className: {
                  container: "grid grid-cols-1 place-content-center",
                  label: "text-white text-xl font-display",
                  button: "text-black text-xl font-display",
                  input: "text-2xl font-display font-normal rounded border-2 text-green-400 border-green-400 text-center drop-shadow-[0_0_9px_rgba(34,197,94,0.9)] ",
                },
              }}
              view={authMode}
              onAuthStateChange={handleAuthStateChange}
              onError={handleError}
            />
            {errorMessage && (
              <div className="text-red-500 text-xl font-display mt-4">
                {errorMessage}
              </div>
            )}
            <button onClick={() => setShowLoginModal(false)}>Close</button>
          </>
          )
        }
      />
    </>
  );
}
