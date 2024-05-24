import { useState, useEffect, useContext } from 'react'
import { supaClient } from "../layout/supa-client";
import { UserContext } from "../layout/App";

export default function UserProfile({ profileName }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [website, setWebsite] = useState(null);
  const [avatar_url, setAvatarUrl] = useState(null);
  const { session, profile } = useContext(UserContext);
  const [ pageError, setPageError ] = useState(null);

  useEffect(() => {
    let ignore = false
    async function getProfile() {
      setLoading(true)
     // const { username } = session

      const { data, error } = await supaClient
        .from('user_profiles')
        .select(`username, website, avatar_url`)
        .eq('username', profileName)
        .single()

      if (!ignore) {
        if (error) {
          console.warn(error);
          console.warn(error.message);
          console.warn(error.details);
          setPageError(error.message);
        } else if (data) {
          setUsername(data.username)
          setWebsite(data.website)
          setAvatarUrl(data.avatar_url)
        }
      }

      setLoading(false);
    }

    getProfile()

    return () => {
      ignore = true
    }
  }, [session, profileName])


  return (
    <>
    { pageError && <p>Sorry, unable to find user named {profileName}.</p>}


    { (loading
      && <p>Loading profile...</p>)
    }
    { (!loading && !pageError &&
      <div className="public-profile">

      <div>
        <label htmlFor="username">User Name</label>
        <div
          id="username"
          type="text"
        >{username || ''}</div>
      </div>

      <div>
        <label htmlFor="website">Website</label>
        <div
          id="website"
          type="url"
        > {website || ''}</div>
      </div>

      </div>

  )}
  </>
  )
}