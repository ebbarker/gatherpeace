import React, { useState, useEffect } from 'react';

export default function FullNameForm({ formData = {}, updateFields, onValidationChange }) {
  const [error, setError] = useState("");

  const validateFullName = (name) => {
    if (!name) {
      return "Full name is required";
    }
    if (name.length < 2) {
      return "Name must be at least 2 characters long";
    }
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const error = validateFullName(value);
    setError(error);
    updateFields({ fullName: value });
  };

  useEffect(() => {
    const isValid = !error && formData.fullName;
    onValidationChange(isValid);
  }, [error, formData.fullName, onValidationChange]);

  return (
    <div className="step-form flex flex-col items-center">
      <h3 className="text-xl mb-4">What's Your Full Name?</h3>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName || ""}
        onChange={handleChange}
        className="text-2xl font-display rounded border-2 text-color-green-400 border-green-400 p-2 m-4 text-center text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)] w-64"
        required
      />
      {error && (
        <p className="text-red-400 validation-feedback text-center">
          {error}
        </p>
      )}
      <p className="text-center text-sm">
        Please enter your full name as you'd like it to appear on your letters.
      </p>
    </div>
  );
}