// NewsFeed.jsx
import React from 'react';
import { Letter } from "../letterTemplates/Letter";
import { Name } from "../letterTemplates/Name"

export function NewsFeed({
  letters,
  setLetters,
  onVoteSuccess,
}) {
  return (
    <div id="news-feed" className="news-feed-container">
      {letters?.map((letter, i) => {
        letter.path = 'root';
        if (letter.post_type === 'letter') {
          return (
            <Letter
              key={letter?.id}
              letters={letters}
              index={i}
              letterData={letter}
              parentIsTimeline={true}
              onVoteSuccess={onVoteSuccess}
            />
          );
        } else if (letter.post_type === 'name') {
          return (
            <Name
              key={letter?.id}
              letters={letters}
              index={i}
              letterData={letter}
              parentIsTimeline={true}
              onVoteSuccess={onVoteSuccess}
            />
          );
        }
      })}
    </div>
  );
}