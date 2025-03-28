import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../layout/App';
import { supaClient } from '../layout/supa-client';
import './AddYourName.css';

export function AddYourName({ letters, setLetters, setAddingName, isOpen }) {
  const user = useContext(UserContext);
  const [addingNameError, setAddingNameError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    peaceTranslation: 'peace',
    letterContent: '',
  });

  // Error state
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState(null);

  // Image file state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById("peace-form")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen]);

  // Handle form cancellation
  const handleCancel = (event) => {
    event.preventDefault();
    setAddingName(false);
  };

  // Validate form data
  const validateForm = (data) => {
    const errors = {};
    if (!data.name) errors.name = 'Name is required';
    if (!data.letterContent) errors.letterContent = 'Message is required';
    return errors;
  };

  // Handle input change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImageError('Image size should not exceed 2MB.');
        setImageFile(null);
        setImagePreviewUrl(null);
        return;
      } else {
        setImageError(null);
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setImageFile(file);
    } else {
      setImagePreviewUrl(null);
      setImageFile(null);
    }
  };

  // Append the new letter to the list
  function appendLetter(newLetter) {
    setLetters([newLetter, ...letters]);
  }

  // Submit the form data
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let imageUrl = null;

    // Handle image upload
    if (imageFile) {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supaClient.storage
        .from('gallery')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError.message);
        setAddingNameError(uploadError);
        setUploading(false);
        return;
      }

      const { data, error: urlError } = supaClient.storage
        .from('gallery')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('Error getting public URL:', urlError.message);
        setAddingNameError(urlError);
        setUploading(false);
        return;
      }

      imageUrl = data.publicUrl;
      setUploading(false);
    }

    // Proceed to submit the form
    submitForm(imageUrl);
  };

  // Submit the form data
  const submitForm = (imageUrl) => {
    supaClient
      .rpc('create_new_name', {
        userId: user.session.user.id,
        content: formData.letterContent,
        sign_off: 'peace',
        sender_name: formData.name,
        recipient: null,
        image_url: imageUrl,
      })
      .then(({ data, error }) => {
        if (error) {
          setAddingNameError(error);
          console.error('Adding name error:', error.message);
        } else {
          const newLetter = {
            id: data[0].new_letter_id,
            content: formData.letterContent,
            score: 0,
            likes: 0,
            username: user.profile.username,
            user_id: user.session.user.id,
            created_at: data[0].creation_time,
            count_comments: 0,
            sign_off: 'peace',
            sender_name: formData.name,
            recipient: 'me',
            post_type: 'name',
            avatar_url: user.profile.avatar_url,
            image_url: imageUrl,
          };
          appendLetter(newLetter);
          user.updateProfile({ has_signed: true });
          setFormData({ name: '', letterContent: '' });
          setImageFile(null);
          setImagePreviewUrl(null);
          setAddingName(false);
        }
      });
  };

  return (
    <div className="App">
      <form id="peace-form" className="peace-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name (required):</label>
          <div className="name-recommendation-text">
            Gather Peace recommends using your real name, or real initials, such as "John S.",
            as the project becomes more significant by emphasizing interactions between real people.
            You can use a fake name if you do not feel comfortable using your real one.
          </div>
          <input
            type="text"
            id="name"
            name="name"
            autoFocus
            onFocus={(e) => { e.target.selectionStart = 0; e.target.selectionEnd = 0; }}
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="letterContent">Message (required, up to 2000 characters):</label>
          <textarea
            id="letterContent"
            name="letterContent"
            value={formData.letterContent}
            onChange={handleChange}
            maxLength="2000"
            rows="5"
            className={errors.letterContent ? 'error' : ''}
          />
          <p className="hint-text">Not sure what to write? Just say "Peace." You can always write another message later.</p>
          {errors.letterContent && <span className="error-message">{errors.letterContent}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="imageUpload">Add a Photo (optional):</label>
          <input
            type="file"
            id="imageUpload"
            name="imageUpload"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imageError && <span className="error-message">{imageError}</span>}
          {imagePreviewUrl && <img src={imagePreviewUrl} alt="Image Preview" className="image-preview" />}
        </div>

        {addingNameError && (
          addingNameError.message === 'You have already added your name' ? (
            <div>You have already added your name to the peace wall. You can only add your name once.</div>
          ) : (
            <div>{addingNameError.message}</div>
          )
        )}

        <div className="button-container">
          <button type="submit" className="submit-button action-button" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Submit'}
          </button>
          <button type="button" className="cancel-button cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
