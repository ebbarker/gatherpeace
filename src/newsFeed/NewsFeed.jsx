// NewsFeed.jsx
import React from 'react';
import { Letter } from "../letterTemplates/Letter";

export function NewsFeed({
  letters,
  setLetters,
  onVoteSuccess,
  deleteLetter
}) {
  return (
    <div id="news-feed" className="news-feed-container">
      {letters?.map((letter, i) => {
        letter.path = 'root';

          return (
            <Letter
              key={letter?.id}
              letters={letters}
              index={i}
              letterData={letter}
              onVoteSuccess={onVoteSuccess}
              deleteLetter={deleteLetter}
            />
          );
      })}
    </div>
  );
}