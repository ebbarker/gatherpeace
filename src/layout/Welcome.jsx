import { useContext, useMemo, useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { UserContext } from "./App";
import Dialog from "./Dialog";
import { supaClient } from "./supa-client";
import useMultiStepform from "./useMultiStepform";
import UsernameForm from "./welcomeSteps/UsernameForm";
import FullNameForm from "./welcomeSteps/FullNameForm";
import LocationForm from "./welcomeSteps/LocationForm";

export async function welcomeLoader() {

  try {
    const {
      data: { user },
    } = await supaClient.auth.getUser();

    if (!user) {

      return redirect("/");
    } else {

    }

    try {
      const { data, error } = await supaClient
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw error;
        return null;
      }

      if (data?.username) {

        return redirect("/");
      }

      return null;
    } catch (innerError) {
      console.error("Error fetching user profile:", innerError);
      return null;
      // Handle the error or redirect as needed
      // Example: return redirect("/error-page");
    }
  } catch (outerError) {
    console.error("Error fetching user data:", outerError);
    // Handle the error or redirect as needed
    // Example: return redirect("/error-page");
  }
}

export function Welcome() {
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { updateProfile } = useContext(UserContext);

  const defaultAvatars = [
    '/default_avatars/dove.jpg',
    '/default_avatars/feather.jpg',
    '/default_avatars/peace.jpg',
  ];

  const formFields = {
    username: "",
    fullName: "",
    country: "",
    stateProvince: "",
    city: "",
  };

  const [formData, setFormData] = useState(formFields);
  const [stepValidation, setStepValidation] = useState({
    username: false,
    fullName: false,
    location: false
  });

  function updateFields(fields) {
    setFormData(prev => ({ ...prev, ...fields }));
  }

  function updateStepValidation(step, isValid) {
    setStepValidation(prev => ({ ...prev, [step]: isValid }));
  }

  const { steps, currentStepIndex, step, next, back, isFirstStep, isLastStep } = useMultiStepform([
    <UsernameForm
      formData={formData}
      updateFields={updateFields}
      onValidationChange={(isValid) => updateStepValidation('username', isValid)}
    />,
    <FullNameForm
      formData={formData}
      updateFields={updateFields}
      onValidationChange={(isValid) => updateStepValidation('fullName', isValid)}
    />,
    <LocationForm
      formData={formData}
      updateFields={updateFields}
      onValidationChange={(isValid) => updateStepValidation('location', isValid)}
    />,
  ]);

  const canProceed = () => {
    switch (currentStepIndex) {
      case 0:
        return stepValidation.username;
      case 1:
        return stepValidation.fullName;
      case 2:
        return stepValidation.location;
      default:
        return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate required fields
    if (!formData.username || !formData.fullName || !formData.country || !formData.city) {
      setServerError("Please fill in all required fields");
      return;
    }

    // Select a random avatar
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    try {
      const { error } = await supaClient
        .from("user_profiles")
        .insert([
          {
            user_id: user.session?.user.id,
            username: formData.username.trim(),
            full_name: formData.fullName.trim(),
            country: formData.country.trim(),
            state_province: formData.stateProvince.trim(),
            city: formData.city.trim(),
            avatar_url: randomAvatar,
          },
        ]);

      if (error) {
        if (error.message.indexOf('duplicate key') !== -1) {
          setServerError(`Username "${formData.username}" is already taken`);
        } else {
          setServerError(`Unknown error: ${error.message}`);
        }
      } else {
        updateProfile({
          username: formData.username,
          avatar_url: randomAvatar,
          full_name: formData.fullName,
          country: formData.country,
          state_province: formData.stateProvince,
          city: formData.city,
        });
        const target = "/?addName=true";
        navigate(target, { replace: true });
        setTimeout(() => {
          navigate(target);
        }, 200);
      }
    } catch (error) {
      setServerError(`Error: ${error.message}`);
    }
  };

  return (
    <Dialog
      allowClose={false}
      open={true}
      contents={
        <>
          <h2 className="text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)] m-4 text-center text-3xl">
            Welcome to Gather Peace
          </h2>
          <form
            className="grid grid-cols-1 place-items-center"
            onSubmit={handleSubmit}
          >
            <div className="stepform-page-counter mb-4">
              {currentStepIndex + 1} / {steps.length}
            </div>
            {step}
            {serverError && (
              <p className="text-red-400 validation-feedback text-center">
                {serverError}
              </p>
            )}
            <div className="create-post-stepform-controls mt-4">
              {!isFirstStep && (
                <button
                  type="button"
                  className="font-display text-2xl bg-green-400 text-center rounded p-2 m-2"
                  onClick={back}
                >
                  Back
                </button>
              )}
              {isLastStep ? (
                <button
                  type="submit"
                  className="font-display text-2xl bg-green-400 text-center rounded p-2 m-2"
                  disabled={!canProceed()}
                >
                  Submit
                </button>
              ) : (
                <button
                  type="button"
                  className={`font-display text-2xl text-center rounded p-2 m-2 ${
                    canProceed()
                      ? 'bg-green-400'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={next}
                  disabled={!canProceed()}
                >
                  Next
                </button>
              )}
            </div>
          </form>
        </>
      }
    />
  );
}

/**
 * This only validates the form on the front end.
 * Server side validation is done at the sql level.
 */
function validateUsername(username){
  if (!username) {
    return "Username is required";
  }
  const regex = /^[a-zA-Z0-9_]+$/;
  if (username.length < 4) {
    return "Username must be at least 4 characters long";
  }
  if (username.length > 14) {
    return "Username must be less than 15 characters long";
  }
  if (!regex.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  return undefined;
}
