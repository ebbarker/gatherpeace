import { useContext, useMemo, useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { UserContext } from "./App";
import Dialog from "./Dialog";
import { supaClient } from "./supa-client";

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
  const [userName, setUserName] = useState("");
  const [serverError, setServerError] = useState("");
  const [formIsDirty, setFormIsDirty] = useState(false);
  const invalidString = useMemo(() => validateUsername(userName), [userName]);
  const { updateProfile } = useContext(UserContext);

  const defaultAvatars = [
    '/default_avatars/dove.jpg',
    '/default_avatars/feather.jpg',
    '/default_avatars/peace.jpg',
  ];

  return (
    <Dialog
      allowClose={false}
      open={true}
      contents={
        <>
          <h2 className="text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)] m-4 text-center text-3xl">
            Welcome to Gather Peace
          </h2>
          <p className="text-center">
            Please pick a username.
          </p>
          <form
            className="grid grid-cols-1 place-items-center"
            onSubmit={(event) => {
              event.preventDefault();

              // Select a random avatar
              const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

              supaClient
                .from("user_profiles")
                .insert([
                  {
                    user_id: user.session?.user.id,
                    username: userName.trim(),
                    avatar_url: randomAvatar,
                  },
                ])
                .then(({ error }) => {
                  if (error) {
                    if (error.message.indexOf('duplicate key') !== -1) {
                      setServerError(`Username "${userName}" is already taken`);

                    } else {
                      setServerError(`Unknown error: ${error.message}`);

                    }
                  } else {
                    updateProfile({ username: userName, avatar_url: randomAvatar });
                    // const target = localStorage.getItem("returnPath") || "/";
                    // localStorage.removeItem("returnPath");
                    const target = "/?addName=true"; // Specify the query parameter to open the section
                    navigate(target, { replace: true }); // Redirect to AllPosts with the openMessage indicator
                    setTimeout(() => {
                      navigate(target);
                    }, 200);
                  }
                });
            }}
          >
            <input
              name="username"
              placeholder="Username"
              onChange={({ target }) => {
                setUserName(target.value);
                if (!formIsDirty) {
                  setFormIsDirty(true);
                }
                if (serverError) {
                  setServerError("");
                }
              }}
              className="text-2xl font-display rounded border-2 text-color-green-400 border-green-400 p-2 m-4 text-center text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)] m-4 text-center text-3xl"
            ></input>
            {formIsDirty && (invalidString || serverError) && (
              <p className="text-red-400 validation-feedback text-center">
                {serverError || invalidString}
              </p>
            )}
            <p className="text-center">
              This is the name people will see you as on Gather Peace.
            </p>
            <button
              className="font-display text-2xl bg-green-400 text-center rounded p-2 m-2 mb-8"
              type="submit"
              disabled={invalidString != null}
            >
              Submit
            </button>
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
