import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";

export const VoteContext = React.createContext();

// export const useVote = () => {
//   const context = useContext(VoteContext);
//   if (!context) {
//     throw new Error('useVote must be used within a VoteProvider');
//   }
//   return context;
// };

export const VoteProvider = ({ children }) => {
  const { session } = useContext(UserContext);
  const [myContextVotes, setMyContextVotes] = useState({});

  useEffect(() => {
    if (session?.user) {
      Promise.all([
        supaClient.from("post_votes").select("*").eq("user_id", session.user.id),
        supaClient.from("letter_votes").select("*").eq("user_id", session.user.id)
      ]).then(([postvotesResponse, letterVotesResponse]) => {
        const { data: postvotesData, error: postvotesError } = postvotesResponse;
        const { data: letterVotesData, error: letterVotesError } = letterVotesResponse;

        if (postvotesError) {
          console.log('Error getting post votes: ' + JSON.stringify(postvotesError));
          return;
        }

        if (letterVotesError) {
          console.log('Error getting letter votes: ' + JSON.stringify(letterVotesError));
          return;
        }

        if (!postvotesData && !letterVotesData) {
          return;
        }

        const combinedVotesData = [...(postvotesData || []), ...(letterVotesData || [])];

        const votes = combinedVotesData.reduce((acc, vote) => {
          const voteId = vote.comment_id || vote.letter_id;
          acc[voteId] = vote.vote_type;
          return acc;
        }, {});

        setMyContextVotes(votes);
      });
    }
  }, [session?.user?.id]);

  return (
    <VoteContext.Provider value={{ myContextVotes, setMyContextVotes }}>
      {children}
    </VoteContext.Provider>
  );


};