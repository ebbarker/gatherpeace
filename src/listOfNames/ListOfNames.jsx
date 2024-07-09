import { AllPosts } from "../AllPosts";
import React from "react";

export function ListOfNames () {
  return (
    <>
      <div>The Following have gathered here.</div>
      <AllPosts parent={'list-of-names'}/>
    </>
  )
}