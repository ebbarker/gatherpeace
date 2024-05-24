import { EmailListSignup } from "./EmailListSignup";
import { PostView } from "../PostView";
import { AllPosts } from "../AllPosts"
import { Monument } from "../monument/Monument"

export default function Home() {

  const titleStyle = {
    marginTop: '50px', // Adjust this value as needed
    // Other existing styles...
    // ...
  };

  return (
    <>
      <Monument />
      <AllPosts />
    </>




  );
}
