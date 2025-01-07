// CreateWallPost.jsx

import React, { useState, useContext } from 'react';
import { UserContext } from '../layout/App';
import { supaClient } from '../layout/supa-client';
import './CreateWallPost.css';
import imageCompression from 'browser-image-compression';


export function CreateWallPost( { posts, setPosts, setWritingWallPost }) {
  const user = useContext(UserContext);

  const [formData, setFormData] = useState({
    content: '',
  });

  // Error states
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState(null);

  // Image file states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleCancel = (event) => {
    event.preventDefault();
    setWritingWallPost(false);
  };

  // Handle form submission
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
        setImageError('Error uploading image. Please try again.');
        setUploading(false);
        return;
      }

      const { data, error: urlError } = supaClient.storage
        .from('gallery')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('Error getting public URL:', urlError.message);
        setImageError('Error getting image URL. Please try again.');
        setUploading(false);
        return;
      }

      imageUrl = data.publicUrl;
      setUploading(false);
    }

    // Proceed to submit the form
    submitForm(imageUrl);
  };

  // Validate form data
  const validateForm = (data) => {
    const errors = {};
    if (!data.content.trim() && !imageFile) {
      errors.content = 'Content or image is required.';
    }
    return errors;
  };

  // Handle input change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image selection and compression
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Allow images up to 5MB for compression
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Please select an image smaller than 5MB.');
        setImageFile(null);
        setImagePreviewUrl(null);
        return;
      } else {
        setImageError(null); // Clear previous errors
      }

      try {
        // Compress the image
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        // Check if the compressed file is still larger than 2MB
        if (compressedFile.size > 2 * 1024 * 1024) {
          setImageError('Compressed image is still larger than 2MB. Please choose a smaller image.');
          setImageFile(null);
          setImagePreviewUrl(null);
          return;
        }

        // Create a preview URL
        const previewUrl = URL.createObjectURL(compressedFile);
        setImagePreviewUrl(previewUrl);

        // Update image file state
        setImageFile(compressedFile);
      } catch (error) {
        console.error('Error during image compression:', error);
        setImageError('There was an error compressing the image. Please try again.');
      }
    } else {
      setImagePreviewUrl(null);
      setImageFile(null);
    }
  };

  // Submit the form data
  const submitForm = (imageUrl) => {
    supaClient
      .rpc('create_wall_post', {
        userId: user.session.user.id,
        content: formData.content,
        image_url: imageUrl, // Image URL is optional
      })
      .then(({ data, error }) => {
        if (error) {
          setErrors({ submit: error.message });
          console.error('Error creating wall post:', error.message);
        } else {
          const newPost = {
            id: data[0].new_post_id, // Adjust to new ID key
            content: formData.content,
            score: 0,
            likes: 0,
            username: user.profile.username,
            user_id: user.session.user.id,
            created_at: data[0].creation_time,
            count_comments: 0,
            post_type: 'wall_post',
            avatar_url: user.profile.avatar_url,
            image_url: imageUrl,
          };
          setPosts([newPost, ...posts]);
          // Reset form
          setFormData({ content: '' });
          setImageFile(null);
          setImagePreviewUrl(null);
        }
      });
  };


  return (
    <div className="create-wall-post">
      <form className="wall-post-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">Content:</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            maxLength="2000"
            rows="5"
            className={errors.content ? 'error' : ''}
          />
          {errors.content && <span className="error-message">{errors.content}</span>}
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
          {imagePreviewUrl && (
            <img src={imagePreviewUrl} alt="Image Preview" className="image-preview" />
          )}
        </div>

        {errors.submit && <span className="error-message">{errors.submit}</span>}

        <div className="button-container">
          <button type="submit" className="submit-button action-button" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Post'}
          </button>
          <button type="button" className="cancel-button cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>

    </div>
  );
}
