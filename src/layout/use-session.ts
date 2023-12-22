import { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supaClient } from "./supa-client";


export function useSession() {
  const [userInfo, setUserInfo] = useState({
    profile: null,
    session: null,
  });
  const [shownWelcome, setShownWelcome] = useState(false);
  const [channel, setChannel] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    console.log('first useEffect called from use-session');
    supaClient.auth.getSession().then(({ data: { session } }) => {
      setUserInfo({ ...userInfo, session });
      supaClient.auth.onAuthStateChange((_event, session) => {
        setUserInfo({ session, profile: null });
      });
    });
  }, []);

  useEffect(() => {
    console.log('second use effect from use-session called');
    console.log('user info ' + JSON.stringify(userInfo))
    if (userInfo.session?.user && !userInfo.profile) {
      listenToUserProfileChanges(userInfo.session.user.id)
      // .then(
      //   (newChannel) => {
      //     if (newChannel) {
      //       if (channel) {
      //         channel.unsubscribe();
      //       }
      //       setChannel(newChannel);
      //     }
      //   }
      // );
    } else if (!userInfo.session?.user) {
      channel?.unsubscribe();
      setChannel(null);
    }
  }, [userInfo.session]);

  async function listenToUserProfileChanges(userId) {
    console.log('calling listen to user profile changes');
    const { data } = await supaClient
      .from("user_profiles")
      .select("*")
      .filter("user_id", "eq", userId);
    if (!data?.length && !shownWelcome) {
      console.log('CALLING WELCOME FROM USe-SESSION')
      console.log(JSON.stringify('data'));
      setShownWelcome(true);
      navigate("/welcome");
    }
    setUserInfo({ ...userInfo, profile: data?.[0] });
    // return supaClient
    //   .channel(`public:user_profiles`)
    //   .on(
    //     "postgres_changes",
    //     {
    //       event: "*",
    //       schema: "public",
    //       table: "user_profiles",
    //       filter: `user_id=eq.${userId}`,
    //     },
    //     (payload) => {
    //       setUserInfo({ ...userInfo, profile: payload.new });
    //     }
    //   )
    //   .subscribe();
  }

  return userInfo;
}
