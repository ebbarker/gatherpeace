import React, { useContext, useState } from 'react';
import useMultiStepform from './useMultiStepform';
import ToForm from './ToForm';
import FromForm from './FromForm';
import LetterContent from './LetterContent';
import { useNavigate } from "react-router-dom";
import { router, UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";

export function Stepform ({ newPostCreated = () => {}, letters, setLetters, setWritingMessage }) {
  const user = useContext(UserContext);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      let nextDiv = e.target.parentElement.nextElementSibling;
      while (nextDiv && nextDiv.querySelector('input') === null) {
        nextDiv = nextDiv.nextElementSibling;
      }

      if (nextDiv && nextDiv.querySelector('input')) {
        nextDiv.querySelector('input').focus();
      } else {
        const nextButton = document.getElementById('next');
        if (nextButton) {
          nextButton.click();
        } else {
          const submitButton = document.getElementById('submit-button');
          if (submitButton) submitButton.click();
        }
      }
    }
  };

  const formFields = {
    sender: "",
    signOff: "Peace,",
    recipient: "Citizens of the World",
    recipientCountry: "World",
    recipientState: "",
    recipientCity: "",
    letterContent: "Peace.",
    handleKeyDown,
  }

  const [formData, setFormData] = useState(formFields);

  function updateFields (fields) {
    setFormData(prev => ({ ...prev, ...fields }));
  }

  const { steps, currentStepIndex, step, goTo, back, next, isFirstStep, isLastStep } = useMultiStepform([
    <ToForm {...formData} updateFields={updateFields} />,
    <LetterContent {...formData} updateFields={updateFields} />,
    <FromForm {...formData} updateFields={updateFields} />,
  ]);

  function appendLetter(userId, content, newId, created_at, signOff, senderName, recipient) {
    let newLetter = {
      id: newId,
      content,
      score: 0,
      likes: 0,
      username: user?.profile?.username,
      user_id: userId,
      created_at,
      count_comments: 0,
      sign_off: signOff,
      sender_name: senderName,
      recipient,
      post_type: 'letter',
      avatar_url: user?.profile?.avatar_url
    }
    setLetters([newLetter, ...letters]);
    setWritingMessage(false);
  }

  function createLetter (event) {
    event.preventDefault();
    const senderName = user?.profile?.full_name || "";
    supaClient
      .rpc("create_new_letter", {
        userId: user?.session?.user?.id,
        content: formData.letterContent,
        sign_off: formData.signOff,
        sender_name: senderName,
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
            formData.signOff,
            senderName,
            formData.recipient
          );
          setFormData(formFields);
          goTo(0);
        }
      });
  }

  function cancelForm (e) {
    e.preventDefault();
    setFormData(formFields);
    setWritingMessage(false);
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
  );
}
