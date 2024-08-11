// NewsFeed.jsx
import React, { useContext } from 'react';
import { Letter } from "../letterTemplates/Letter";
import { VoteContext } from "../contexts/VoteContext";

export function NewsFeed({
  letters,
  setLetters,
  onVoteSuccess,
  deleteLetter
}) {
  const { myContextVotes, setMyContextVotes } = useContext(VoteContext);
  return (
    <div id="news-feed" className="news-feed-container">
      {letters?.map((letter, i) => {
        letter.path = 'root';
        if (myContextVotes[letter.id] === 'down') {
          return;
        } else {
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
        }
      })}
    </div>
  );

}