import { EmailListSignup } from "./EmailListSignup";
import { PostView } from "../PostView";
import { AllPosts } from "../AllPosts"

export default function Home() {

  const titleStyle = {
    marginTop: '50px', // Adjust this value as needed
    // Other existing styles...
    // ...
  };

  return (
    <div className="grid place-content-center justify-center w-full" style={titleStyle} >
      {/* <h1 className="text-green-400 padding-top-60 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)] m-4 text-center text-5xl" >
        Welcome to Gather Peace
      </h1> */}
      {/* <p className="text-center font-sans drop-shadow border-gray-800 border-2 rounded-lg bg-gray-600">
        We're still launching - be on the lookout for cool stuff soon!
      </p>
      {/* <EmailListSignup /> */}
         <>
     <AllPosts />
   </>
   </div>


  );
}
