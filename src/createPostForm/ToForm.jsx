import { FormWrapper } from "./FormWrapper";
import React, { useState, useEffect } from "react";
import axios from "axios";
import countries from "./countries";

export default function ToForm({
  recipient,
  recipientCountry,
  recipientState,
  recipientCity,
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
      <div>
        <label>Recipient Country</label>
        <select
          id="recipient-country"
          required
          onChange={e => updateFields({ recipientCountry: e.target.value })}
          onKeyDown={handleKeyDown}
          value={recipientCountry}
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.name} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>State/Province</label>
        <input
        id="recipient-state"
        required
        type="text"
        className="form-input"
        onChange={e => updateFields({ recipientState: e.target.value })}
        onKeyDown={handleKeyDown}
        value={recipientState}/>
      </div>
      <div>
        <label>Recipient City</label>
        <input
        id="recipient-city"
        required
        type="text"
        className="form-input"
        onChange={e => updateFields({ recipientCity: e.target.value })}
        onKeyDown={handleKeyDown}
        value={recipientCity}/>
      </div>

    </FormWrapper>
  )
}