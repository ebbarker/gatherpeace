import { useState, useEffect, useContext } from 'react'
import { supaClient } from "../layout/supa-client";
import { UserContext } from "../layout/App";

export default function UserProfile({ profileName }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [website, setWebsite] = useState(null);
  const [avatar_url, setAvatarUrl] = useState(null);
  const { session } = useContext(UserContext);

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
          console.warn(error)
        } else if (data) {
          setUsername(data.username)
          setWebsite(data.website)
          setAvatarUrl(data.avatar_url)
        }
      }

      setLoading(false)
    }

    getProfile()

    return () => {
      ignore = true
    }
  }, [session, profileName])

  async function updateProfile(event, avatarUrl) {
    console.log('updating...');
    event.preventDefault()

    setLoading(true)
    const { user } = session

    const updates = {
      user_id: user?.id,
      username,
      website,
      avatar_url,
      updated_at: new Date(),
    }

    const { error } = await supaClient.from('user_profiles').upsert(updates);

    if (error) {
      alert(error.message)
    } else {
      setAvatarUrl(avatarUrl)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={updateProfile} className="form-widget">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={session?.user.email} disabled />
      </div>
      <div>
        <label htmlFor="username">Name</label>
        <input
          id="username"
          type="text"
          required
          value={username || ''}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="url"
          value={website || ''}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <button className="button block primary" type="submit" disabled={loading}>
          {loading ? 'Loading ...' : 'Update'}
        </button>
      </div>

      <div>
        <button className="button block" type="button" onClick={() => supabase.auth.signOut()}>
          Sign Out
        </button>
      </div>
    </form>
  )
}