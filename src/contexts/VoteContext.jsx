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
      supaClient
        .from("post_votes")
        .select("*")
        .eq("user_id", session.user.id)
        .then(({ data: votesData }) => {
          if (!votesData) {
            return;
          }
          const votes = votesData.reduce((acc, vote) => {
            acc[vote.post_id] = vote.vote_type;
            return acc;
          }, {});
          setMyContextVotes(votes);
          console.log('my votes + ' + JSON.stringify(myContextVotes))
        });
    }

  }, [session]);

  return (
    <VoteContext.Provider value={{ myContextVotes, setMyContextVotes }}>
      {children}
    </VoteContext.Provider>
  );


};