import React, { useState, useRef, useEffect } from 'react';

const MAX_LINES = 5; // Maximum number of lines
const LINE_HEIGHT = 1; // Line height in em

export function MessageContent({ content }) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [shownContent, setShownContent] = useState([]);
  const hiddenContentRef = useRef(null);

  useEffect(() => {
    if (hiddenContentRef.current) {
      const maxHeight = MAX_LINES * LINE_HEIGHT * parseFloat(getComputedStyle(hiddenContentRef.current).fontSize);
      calculateVisibleContent(maxHeight);
    }
  }, [content]);

  const calculateVisibleContent = (maxHeight) => {
    const paragraphs = content.split("\n");
    let currentHeight = 0;
    let visibleParagraphs = [];

    for (let paragraph of paragraphs) {
      const tempDiv = document.createElement('div');
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.position = 'absolute';
      tempDiv.style.width = '100%';
      tempDiv.style.whiteSpace = 'pre-wrap';
      tempDiv.innerText = paragraph;
      document.body.appendChild(tempDiv);

      const paragraphHeight = tempDiv.scrollHeight;
      document.body.removeChild(tempDiv);

      if (currentHeight + paragraphHeight <= maxHeight) {
        visibleParagraphs.push(paragraph);
        currentHeight += paragraphHeight;
      } else {
        break;
      }
    }

    setShownContent(visibleParagraphs);
  };

  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  return (
    <div className="flex-auto letter-content-container">
      {!showFullContent ? (
        <div>
          <div className="post-content-container">
            {shownContent.map((paragraph, index) => (
              <p key={index} className="text-left">{paragraph}</p>
            ))}
          </div>
          {shownContent.length < content.split("\n").length && (
            <button onClick={toggleContent} className="see-more-button">See More</button>
          )}
        </div>
      ) : (
        <div>
          <div className="post-content-container">
            {content.split("\n").map((paragraph, index) => (
              <p key={index} className="text-left">{paragraph}</p>
            ))}
          </div>
          <button onClick={toggleContent} className="see-less-button">See Less</button>
        </div>
      )}
      <div
        ref={hiddenContentRef}
        className="hidden-content-container"
        style={{
          visibility: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          height: 'auto',
          overflow: 'visible',
          whiteSpace: 'pre-wrap',
        }}
      >
        {content.split("\n").map((paragraph, index) => (
          <p key={index} className="text-left">{paragraph}</p>
        ))}
      </div>
    </div>
  );
}