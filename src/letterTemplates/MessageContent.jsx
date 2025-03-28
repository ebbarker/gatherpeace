import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "./Letter.css";

const MAX_CHARACTERS = 400; // Maximum number of characters before truncating

export function MessageContent({ content }) {
  const [showFullContent, setShowFullContent] = useState(false);

  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  // Function to convert #tags into links
  const convertToLinks = (text) => {
    const tagRegex = /#(\w+)/g; // Regex to find #tags
    return text.split("\n").map((paragraph, index) => (
      <p key={index} className="text-left">
        {paragraph.split(tagRegex).reduce((acc, part, idx) => {
          if (idx % 2 === 0) {
            // Even indexes are plain text
            acc.push(part);
          } else {
            // Odd indexes are tags (matched by the regex)
            acc.push(
              <Link key={idx} to={`/peace-wall/1?query=%23${part}`} className="hashtag-link">
                #{part}
              </Link>
            );
          }
          return acc;
        }, [])}
      </p>
    ));
  };

  // If we are showing full content, just display it all
  if (showFullContent) {
    return (
      <div className="flex-auto letter-content-container">
        <div className="post-content-container">
          {convertToLinks(content)}
        </div>
        <button onClick={toggleContent} className="see-less-button">See Less</button>
      </div>
    );
  }

  // If we're showing only truncated content
  const truncatedContent = content.length > MAX_CHARACTERS
    ? content.slice(0, MAX_CHARACTERS) + '...'
    : content;

  return (
    <div className="flex-auto letter-content-container">
      <div className="post-content-container">
        {convertToLinks(truncatedContent)}
      </div>
      {content.length > MAX_CHARACTERS && (
        <button onClick={toggleContent} className="see-more-button">See More</button>
      )}
    </div>
  );
}
