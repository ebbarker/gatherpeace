import React, { useState } from 'react';
import "./AddYourName.css";

export function AddYourName({letters, setLetters, setAddingName}) {
  const [formData, setFormData] = useState({
    name: '',
    peaceTranslation: '',
    country: '',
    state: '',
    city: '',
    message: ''
  });

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

    // Clear errors
    setErrors({});

    // Call the form submission function
    submitForm(formData);

    // Clear form
    setFormData({
      name: '',
      peaceTranslation: '',
      country: '',
      state: '',
      city: ''
    });
  };

  const handleCancel = (event) => {
    event.preventDefault();
    setAddingName(false);
  }

  // Validate form data
  const validateForm = (data) => {
    const errors = {};
    if (!data.name) errors.name = 'Name is required';
    if (!data.peaceTranslation) errors.peaceTranslation = 'Peace translation is required';
    if (!data.country) errors.country = 'Country is required';
    return errors;
  };

  // Handle input change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Form submission function (empty for now)
  const submitForm = (data) => {
    console.log('Form submitted:', data);
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

        <div className="form-group">
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
        </div>

        <div className="form-group">
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
        </div>

        <div className="form-group">
          <label htmlFor="message">Message (optional, up to 2000 characters):</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            maxLength="2000"
            rows="5"
            className={errors.message ? 'error' : ''}
          />
          {errors.message && <span className="error-message">{errors.message}</span>}
        </div>

        <div className="button-container">
          <button type="submit" className="submit-button action-button" onClick={handleSubmit}>Submit</button>
          <button type="button" className="cancel-button cancel-button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}