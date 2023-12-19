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
    console.log('session user id ' + session);
    if (session?.user) {
    //   supaClient
    //     .from("post_votes")
    //     .select("*")
    //     .eq("user_id", session.user.id)
    //     .then(({ data: votesData, error }) => {
    //       if (error) {
    //         console.log('error getting votes: ' + JSON.stringify(error));
    //         return;
    //       }
    //       if (!votesData) {
    //         return;
    //       }
    //       const votes = votesData.reduce((acc, vote) => {
    //         acc[vote.post_id] = vote.vote_type;
    //         return acc;
    //       }, {});
    //       setMyContextVotes(votes);
    //       console.log('my votes + ' + JSON.stringify(myContextVotes));
    //       console.log('session: ' + session.user.id);
    //       console.log(v);
    //     });
    Promise.all([
      supaClient.from("post_votes").select("*").eq("user_id", session.user.id),
      supaClient.from("letter_votes").select("*").eq("user_id", session.user.id)
    ]).then(([postVotesResponse, letterVotesResponse]) => {
      const { data: postVotesData, error: postVotesError } = postVotesResponse;
      const { data: letterVotesData, error: letterVotesError } = letterVotesResponse;

      if (postVotesError) {
        console.log('Error getting post votes: ' + JSON.stringify(postVotesError));
        return;
      }

      if (letterVotesError) {
        console.log('Error getting letter votes: ' + JSON.stringify(letterVotesError));
        return;
      }

      if (!postVotesData && !letterVotesData) {
        return;
      }

      const combinedVotesData = [...(postVotesData || []), ...(letterVotesData || [])];

      const votes = combinedVotesData.reduce((acc, vote) => {
        const voteId = vote.post_id || vote.letter_id;
        acc[voteId] = vote.vote_type;
        return acc;
      }, {});

      setMyContextVotes(votes);
      console.log('my votes + ' + JSON.stringify(votes)); // Note: This will log the current votes, not the updated state
      console.log('session: ' + session.user.id);
    });
    }

  }, [session]);

  return (
    <VoteContext.Provider value={{ myContextVotes, setMyContextVotes }}>
      {children}
    </VoteContext.Provider>
  );


};