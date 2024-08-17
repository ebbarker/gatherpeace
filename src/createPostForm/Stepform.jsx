import React, { useContext, useState } from 'react';
import useMultiStepform from './useMultiStepform';
import ToForm from './ToForm';
import FromForm from './FromForm';
import LetterContent from './LetterContent';
import YourNameForm from './YourNameForm';
import { useNavigate } from "react-router-dom";
import { router, UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";

export function Stepform ({ newPostCreated = () => {}, letters, setLetters, setWritingMessage }) {
  const user = useContext(UserContext);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log('Enter pressed');

      // Traverse up to the parent div and then to the next div
      let nextDiv = e.target.parentElement.nextElementSibling;
      while (nextDiv && nextDiv.querySelector('input') === null) {
        nextDiv = nextDiv.nextElementSibling;
      }

      // Focus on the input inside the next div, if found
      if (nextDiv && nextDiv.querySelector('input')) {
        // Focus on the next input if found
        nextDiv.querySelector('input').focus();
      } else {
        // No more inputs, try to click the 'next' button
        const nextButton = document.getElementById('next');
        if (nextButton) {
          nextButton.click();
        } else {
          const submitButton = document.getElementById('submit-button');
          if (submitButton) submitButton.click();
        }
    }
  };
}

  const formFields = {
    sender: "",
    senderCountry: "",
    senderState: "",
    senderCity: "",
    signOff: "Peace,",
    senderName: "",
    recipient: "Citizens of the World",
    recipientCountry: "World",
    recipientState: "",
    recipientCity: "",
    letterContent: "Peace.",
    handleKeyDown,

  }

  const [formData, setFormData] = useState(formFields);

  function updateFields (fields) {
    setFormData(prev => {
      return {...prev, ...fields}
    })

  }

  const { steps, currentStepIndex, step, goTo, back, next, isFirstStep, isLastStep } = useMultiStepform([
    <ToForm {...formData} updateFields={updateFields} />,
    <LetterContent {...formData} updateFields={updateFields} />,
    <FromForm {...formData} updateFields={updateFields} />,
    <YourNameForm {...formData} updateFields={updateFields} />,
  ]);

  function appendLetter(userId, content, newId, created_at, senderCountry, senderState, senderCity, signOff, senderName,
    recipient,
    recipientCountry,
    recipientState,
    recipientCity) {
    let newLetter = {
      id: newId,
      content,
      score: 0,
      likes: 0,
      username: user?.profile?.username,
      user_id: userId,
      created_at,
      count_comments: 0,
      sender_country: senderCountry,
      sender_state: senderState,
      sender_city: senderCity,
      sign_off: signOff,
      sender_name: senderName,
      recipient,
      post_type: 'letter',
      avatar_url: user?.profile?.avatar_url
    }
    setLetters([newLetter, ...letters]);
    console.log(letters);
  }



  function createLetter (event) {
    event.preventDefault();
    supaClient
      .rpc("create_new_letter", {
        userId: user?.session?.user?.id,
        content: formData.letterContent,
        sender_country: formData.senderCountry,
        sender_state: formData.senderState,
        sender_city: formData.senderCity,
        sign_off: formData.signOff,
        sender_name: formData.senderName,
        recipient: formData.recipient,
        post_type: 'letter'
      })
      .then(({ data, error }) => {
        if (error) {
          console.log(error);
        } else {
          appendLetter(
            user.session?.user.id,
            formData.letterContent,
            data[0].new_letter_id,
            data[0].creation_time,
            formData.senderCountry,
            formData.senderState,
            formData.senderCity,
            formData.signOff,
            formData.senderName,
            formData.recipient,
          );
          setFormData(formFields);
          goTo(0);

        }
      });
  }

  function cancelForm (e) {
    e.preventDefault();
    setFormData(formFields);
    setWritingMessage(false)
  }


  return (
    <>

            <div className="create-post-step-container">
              <div className="create-post-form-container">
                <form className="create-post-stepform">
                  <div className="stepform-page-counter">
                    {currentStepIndex + 1} / {steps.length}
                  </div>
                  {step}
                  <div className="create-post-stepform-controls">
                    {!isFirstStep && <button className="form-button" onClick={back}>Back</button>}
                    {
                      isLastStep ?
                      <button className="form-button" id="submit-button" type="submit" onClick={createLetter}>Submit</button>  :
                      <button id="next" className="form-button" onClick={next}>Next</button>
                    }
                  </div>

                </form>
              </div>
              <button className="form-button cancel-button form-cancel-button" onClick={cancelForm}>Cancel</button>

          </div>


    </>
  )
}
