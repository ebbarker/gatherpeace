import { FormWrapper } from "./FormWrapper";
import React, { useState, useEffect } from "react";
import axios from "axios";
import countries from "./countries";

export default function ToForm({
  recipient,
  updateFields,
  handleKeyDown,
  next
}) {


  // const handleKeyDownForTo = (e) => {

  //   if (e.key === "Enter") {

  //     console.log('entered');
  //     e.preventDefault();
  //     document.getElementById('sender-Location').focus();
  //   }
  // };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   // handle form submission logic here if necessary
  // };

  return (
    <FormWrapper title="Who is this message for?">
      <div>
        <label>To </label>
        <input
        handleKeyDownForTo
        autoFocus
        required
        type="text"
        className="form-input"
        onChange={e => updateFields({ recipient: e.target.value })}
        onKeyDown={handleKeyDown}
        value={recipient}/>
      </div>


    </FormWrapper>
  )
}