// import { RealtimeChannel, Session } from "@supabase/supabase-js";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supaClient } from "./supa-client";

// export interface UserProfile {
//   username: string;
//   avatarUrl?: string;
// }

// export interface SupashipUserInfo {
//   session: Session | null;
//   profile: UserProfile | null;
// }

// export function useSession(): SupashipUserInfo {
//   const [userInfo, setUserInfo] = useState<SupashipUserInfo>({
//     profile: null,
//     session: null,
//   });
//   const [channel, setChannel] = useState<RealtimeChannel | null>(null);
//   const navigate = useNavigate();
//   useEffect(() => {
//     supaClient.auth.getSession().then(({ data: { session } }) => {
//       setUserInfo({ ...userInfo, session });
//       supaClient.auth.onAuthStateChange((_event, session) => {
//         setUserInfo({ session, profile: null });
//       });
//     });
//   }, []);

//   useEffect(() => {
//     if (userInfo.session?.user && !userInfo.profile) {
//       listenToUserProfileChanges(userInfo.session.user.id).then(
//         (newChannel) => {
//           if (newChannel) {
//             if (channel) {
//               channel.unsubscribe();
//             }
//             setChannel(newChannel);
//           }
//         }
//       );
//     } else if (!userInfo.session?.user) {
//       channel?.unsubscribe();
//       setChannel(null);
//     }
//   }, [userInfo.session]);

//   async function listenToUserProfileChanges(userId: string) {
//     const { data } = await supaClient
//       .from("user_profiles")
//       .select("*")
//       .filter("user_id", "eq", userId);
//     if (!data?.length) {
//       navigate("/welcome");
//     }
//     setUserInfo({ ...userInfo, profile: data?.[0] });
//     return supaClient
//       .channel(`public:user_profiles`)
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "user_profiles",
//           filter: `user_id=eq.${userId}`,
//         },
//         (payload) => {
//           setUserInfo({ ...userInfo, profile: payload.new as UserProfile });
//         }
//       )
//       .subscribe();
//   }

//   return userInfo;
// }

// import { RealtimeChannel, Session } from "@supabase/supabase-js";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supaClient } from "./supa-client.ts";


// export function useSession() {
//   const [userInfo, setUserInfo] = useState({
//     profile: null,
//     session: null,
//   });
//   const [shownWelcome, setShownWelcome] = useState(false);
//   const [channel, setChannel] = useState(null);
//   const navigate = useNavigate();
//   useEffect(() => {

//     supaClient.auth.getSession().then(({ data: { session } }) => {
//       setUserInfo({ ...userInfo, session });
//       supaClient.auth.onAuthStateChange((_event, session) => {
//         setUserInfo({ session, profile: null });
//       });
//     });
//   }, []);
//   // Provide a method to update userInfo
//   const updateProfile = (updatedProfile) => {
//     setUserInfo((prevState) => ({
//       ...prevState,
//       profile: { ...prevState.profile, ...updatedProfile },
//     }));
//   };

// // Make sure to provide updateUserInfo as part of the context value


//   useEffect(() => {
//     console.log('USER INFO: ' + JSON.stringify(userInfo));
//     if (userInfo.session?.user && !userInfo.profile) {
//       console.log('userInfoSessionUser AND NoUserInfoProfile found');
//       listenToUserProfileChanges(userInfo.session.user.id)
//       .then(
//         (newChannel) => {
//           if (newChannel) {
//             if (channel) {
//               channel.unsubscribe();
//             }
//             setChannel(newChannel);
//           }
//         }
//       );
//     } else if (!userInfo.session?.user) {
//       channel?.unsubscribe();
//       setChannel(null);
//     }
//   }, [userInfo.session]);

//   async function listenToUserProfileChanges(userId) {

//     const { data } = await supaClient
//       .from("user_profiles")
//       .select("*")
//       .filter("user_id", "eq", userId);
//     if (!data?.length && !shownWelcome) {

//       setShownWelcome(true);
//       navigate("/welcome");
//     } else {

//       setUserInfo({ ...userInfo, profile: data?.[0] });
//     }
//     return supaClient
//       .channel(`public:user_profiles`)
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "user_profiles",
//           filter: `user_id=eq.${userId}`,
//         },
//         (payload) => {
//           setUserInfo({ ...userInfo, profile: payload.new });
//         }
//       )
//       //.subscribe();
//   }

//   return { ...userInfo, updateProfile };
// }


// import { RealtimeChannel, Session } from "@supabase/supabase-js";
// import { useEffect, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { supaClient } from "./supa-client.ts";

// export function useSession() {
//   const [session, setSession] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [shownWelcome, setShownWelcome] = useState(false);
//   const [channel, setChannel] = useState(null);
//   const navigate = useNavigate();

//   const fetchSession = useCallback(async () => {
//     const { data: { session } } = await supaClient.auth.getSession();
//     console.log('Fetched session:', session);
//     setSession(session);
//   }, []);

//   const fetchProfile = useCallback(async (userId) => {
//     const { data } = await supaClient
//       .from("user_profiles")
//       .select("*")
//       .filter("user_id", "eq", userId);

//     if (!data?.length && !shownWelcome) {
//       setShownWelcome(true);
//       navigate("/welcome");
//     } else {
//       setProfile(data?.[0]);
//     }
//   }, [shownWelcome, navigate]);

//   useEffect(() => {
//     fetchSession();
//     const { data: authListener } = supaClient.auth.onAuthStateChange((event, session) => {
//       console.log('Auth state changed:', event, session);
//       setSession(session);
//      // setProfile(null); // Clear profile on auth state change
//     });

//     return () => {
//       authListener?.unsubscribe();
//     };
//   }, [fetchSession]);

//   useEffect(() => {
//     if (session?.user && !profile) {
//       listenToUserProfileChanges(session.user.id);
//     } else if (!session?.user) {
//       channel?.unsubscribe();
//       setChannel(null);
//     }
//   }, [session, profile]);

//   const listenToUserProfileChanges = async (userId) => {
//     await fetchProfile(userId);

//     const newChannel = supaClient
//       .channel(`public:user_profiles`)
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "user_profiles",
//           filter: `user_id=eq.${userId}`,
//         },
//         (payload) => {
//           setProfile(payload.new);
//         }
//       )
//       .subscribe();

//     if (channel) {
//       channel.unsubscribe();
//     }
//     setChannel(newChannel);
//   };

//   const updateProfile = (updatedProfile) => {
//     setProfile((prevProfile) => ({
//       ...prevProfile,
//       ...updatedProfile,
//     }));
//   };

//   return { session, profile, updateProfile };
// }

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supaClient } from "./supa-client.ts";

export function useSession() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [shownWelcome, setShownWelcome] = useState(false);
  const [channel, setChannel] = useState(null);
  const navigate = useNavigate();

  const fetchSession = useCallback(async () => {
    console.log('Fetched session');
    const { data: { session } } = await supaClient.auth.getSession();

    setSession(session);
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    console.log('PROFILER CHANGED');
    const { data } = await supaClient
      .from("user_profiles")
      .select("*")
      .filter("user_id", "eq", userId);

    if (!data?.length && !shownWelcome) {
      setShownWelcome(true);
      navigate("/welcome");
    } else {
      setProfile(data?.[0]);
    }
  }, [shownWelcome, navigate]);

  useEffect(() => {

    fetchSession();

    const { data: authListener } = supaClient.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed');
      setSession(session);
      if (!session) setProfile(null); 
    });

    return () => {
      if (authListener?.unsubscribe) {
        authListener?.unsubscribe();
      }

    };
  }, [fetchSession]);

  useEffect(() => {
    if (session?.user && !profile) {
      listenToUserProfileChanges(session.user.id);
    } else if (!session?.user) {
      channel?.unsubscribe();
      setChannel(null);
    }
  }, [session, profile]);

  const listenToUserProfileChanges = async (userId) => {
    await fetchProfile(userId);

    const newChannel = supaClient
      .channel(`public:user_profiles`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    if (channel) {
      channel.unsubscribe();
    }
    setChannel(newChannel);
  };

  const updateProfile = (updatedProfile) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      ...updatedProfile,
    }));
  };

  return { session, profile, updateProfile };
}
