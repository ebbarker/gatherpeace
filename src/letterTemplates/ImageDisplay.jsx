// ImageDisplay.jsx
import "./ImageDisplay.css";

export function ImageDisplay({ imageUrl, altText = 'Image' }) {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="image-display-container">
      <img src={imageUrl} alt={altText} className="letter-image" />
    </div>
  );
}
