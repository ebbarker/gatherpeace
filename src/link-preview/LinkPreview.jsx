import React from 'react';
import './LinkPreview.css'; // Importing the CSS file

const LinkPreview = ({ ogPreview }) => {
    return (
        <div className="link-preview">
            {ogPreview.image && (
                <div className="preview-image-container">
                    <img src={ogPreview.image} alt="Preview" className="preview-image" />
                </div>
            )}
            <div className="preview-text">
                <h3 className="preview-title">{ogPreview.title}</h3>
                <p className="preview-description">{ogPreview.description}</p>
                <p className="preview-site">{ogPreview.site}</p>
            </div>
        </div>
    );
}

export default LinkPreview;
