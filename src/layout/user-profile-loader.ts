import { useContext } from "react";
import { redirect } from "react-router-dom";
import { UserContext } from "./App";

export function userWelcomeLoader() {
  console.log('user welcome loader called');
  const user = useContext(UserContext);
  if (user.session && !user.profile) {
    console.log('need username')
    redirect("/welcome");
  }
}
