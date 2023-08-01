import { useContext, useState } from "react";
import { UserContext } from "./layout/App";
import { supaClient } from "./layout/supa-client";

export default function UserMenu() {
  const { profile } = useContext(UserContext);
  const [dropdownVisible, setDropdownVisible] = useState(true); // create a new state variable for the dropdown visibility

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible); // toggle the dropdown visibility when the username is clicked
  };

  return (
    <>
      <li class="sub-menu">
        <a href="#" onClick={toggleDropdown}>
          {profile?.username || "Welcome"}
          <i class="fa fa-angle-down"></i>
        </a>
        {/* {dropdownVisible && ( */}{(
          <ul class="dropdown-menu">
            <li>
              <a href="#" onClick={() => supaClient.auth.signOut()}>
                Logout
              </a>
            </li>
          </ul>
        )}
      </li>
    </>
  );
}


{/* <>
<div className="flex flex-col">
  <h2>Welcome {profile?.username || "dawg"}.</h2>
  <button
    onClick={() => supaClient.auth.signOut()}
    className="md:inline-block px-4 py-2 text-xl font-display text-black hover:text-white bg-white hover:bg-purple-600 drop-shadow-[6px_6px_0_black] hover:drop-shadow-[0_0_7px_rgba(168,85,247,0.5)] transition-all duration-300"
  >
    Logout
  </button>
</div>
</> */}