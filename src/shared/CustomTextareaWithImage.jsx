// CustomTextAreaWithImage.jsx

import React, { useRef, useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import './CustomTextAreaWithImage.css';

export  function CustomTextAreaWithImage({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  maxLength = 2000,
  rows = 5,
  error = '',
  setImageFile,
  imageFile
}) {
  const fileInputRef = useRef(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Handle image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      // Pass the file back to the parent component

        setImageFile(previewUrl);

    } else {
      setImagePreviewUrl(null);

        setImageFile(null);

    }
  };

  return (
    <div className="form-group">
      {label && <label htmlFor={name}>{label}</label>}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className={error ? 'error' : ''}
      />
      {error && <span className="error-message">{error}</span>}

      {/* Hidden file input */}
      <input
        type="file"
        id={`${name}-imageUpload`}
        name={`${name}-imageUpload`}
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />

      {/* "Add Photo" button */}
      <button
        type="button"
        className="add-photo-button"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <FiUpload size={20} /> Add a Photo
      </button>

      {/* Image preview */}
      {imagePreviewUrl && (
        <img src={imagePreviewUrl} alt="Image Preview" className="image-preview" />
      )}
    </div>
  );
}
