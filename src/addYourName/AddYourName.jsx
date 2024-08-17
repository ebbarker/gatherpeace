import React, { useState, useContext } from 'react';
import { router, UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import "./AddYourName.css";
import { CountryDropdown } from "../shared/CountryDropdown"

export function AddYourName({ letters, setLetters, setAddingName }) {
  const user = useContext(UserContext);
  const [addingNameError, setAddingNameError] = useState(null);
  const formFields = {
    name: '',
    peaceTranslation: '',
    // country: '',
    // state: '',
    // city: '',
    letterContent: ''
  }
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  const [formData, setFormData] = useState(formFields);



  // Error state
  const [errors, setErrors] = useState({});

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    //console.log(JSON.stringify(validationErrors));
    // Clear errors
   // setErrors({});

    // Call the form submission function
    submitForm(formData);

    // Clear form
    // setFormData({
    //   name: '',
    //   peaceTranslation: '',
    //   country: '',
    //   state: '',
    //   city: '',
    //   message: ''
    // });
  };

  const handleCancel = (event) => {
    event.preventDefault();
    setAddingName(false);
  };

  // Validate form data
  const validateForm = (data) => {
    const errors = {};
    if (!data.name) errors.name = 'Name is required';
    if (!data.peaceTranslation) errors.peaceTranslation = 'Peace translation is required';
    // if (!data.country) errors.country = 'Country is required';
    return errors;
  };

  // Handle input change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };


  function appendLetter(userId, content, newId, created_at, senderCountry, senderState, senderCity, peaceTranslation, senderName,
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
      sign_off: peaceTranslation,
      sender_name: senderName,
      recipient: 'me',
      post_type: 'name',
      avatar_url: user?.profile?.avatar_url
    }
    console.log('new letter: ' + JSON.stringify(newLetter))
    setLetters([newLetter, ...letters]);
    console.log(letters);
  }

  const submitForm = () => {

    supaClient
      .rpc("create_new_name", {
        userId: user?.session?.user?.id,
        content: formData.letterContent,
        sender_country: country,
        sender_state: state,
        sender_city: city,
        sign_off: formData.peaceTranslation,
        sender_name: formData.name,
        recipient: null,
      })
      .then(({ data, error }) => {
        if (error) {
          setAddingNameError(error);
          console.log(error);
          console.log('adding name error: ' + addingNameError);
        } else {
          appendLetter(
            user.session?.user.id,
            formData.letterContent,
            data[0].new_letter_id,
            data[0].creation_time,
            country,
            state,
            city,
            formData.peaceTranslation,
            formData.name,
            formData.recipient,
          );
          user.updateProfile({has_signed: true});
          setFormData(formFields);
          setAddingName(false);
        }
      });
  };

  return (
    <div className="App">
      <form className="peace-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name (required):</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="peaceTranslation">Write "peace" in your language (required):</label>
          <input
            type="text"
            id="peaceTranslation"
            name="peaceTranslation"
            value={formData.peaceTranslation}
            onChange={handleChange}
            className={errors.peaceTranslation ? 'error' : ''}
          />
          {errors.peaceTranslation && <span className="error-message">{errors.peaceTranslation}</span>}
        </div>

        {/* <div className="form-group">
          <label htmlFor="country">Country (required):</label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className={errors.country ? 'error' : ''}
          />
          {errors.country && <span className="error-message">{errors.country}</span>}
        </div> */}

          <CountryDropdown
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            country={country}
            setCountry={setCountry}
            state={state}
            city={city}
            setState={setState}
            setCity={setCity}
          />



        {/* <div className="form-group">
          <label htmlFor="state">State/Province (optional):</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City (optional):</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div> */}

        <div className="form-group">
          <label htmlFor="message">Message (optional, up to 2000 characters):</label>
          <textarea
            id="message"
            name="letterContent"
            value={formData.letterContent}
            onChange={handleChange}
            maxLength="2000"
            rows="5"
            className={errors.message ? 'error' : ''}
          />
          {errors.message && <span className="error-message">Error: {errors.message}</span>}
        </div>
        {addingNameError && (addingNameError.message = "You have already added your name" ?
         <div>You have already added your name to the peace wall. You can only add your name once, but you can write on the Peace Wall as many times as you would like.</div> :
         <div>{addingNameError.message}</div>)
        }
        {!addingNameError && (<div className="button-container">
          <button type="submit" className="submit-button action-button" onClick={handleSubmit}>Submit</button>
          <button type="button" className="cancel-button cancel-button" onClick={handleCancel}>Cancel</button>
        </div>)}
      </form>
    </div>
  );
}
