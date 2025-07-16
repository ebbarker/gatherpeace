import React, { useState, useEffect } from 'react';

export default function UsernameForm({ formData = {}, updateFields, onValidationChange }) {
  const [error, setError] = useState("");

  const validateUsername = (username) => {
    if (!username) {
      return "Username is required";
    }
    const regex = /^[a-zA-Z0-9_]+$/;
    if (username.length < 4) {
      return "Username must be at least 4 characters long";
    }
    if (username.length > 14) {
      return "Username must be less than 15 characters long";
    }
    if (!regex.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const error = validateUsername(value);
    setError(error);
    updateFields({ username: value });
  };

  useEffect(() => {
    const isValid = !error && formData.username;
    onValidationChange(isValid);
  }, [error, formData.username, onValidationChange]);

  return (
    <div className="step-form flex flex-col items-center">
      <h3 className="text-xl mb-4">Choose Your Username</h3>
      <input
        type="text"
        placeholder="Username"
        value={formData.username || ""}
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
        This is the name people will see you as on Gather Peace.
      </p>
    </div>
  );
}