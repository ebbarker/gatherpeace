import { useState, useEffect, useContext } from 'react';
import { supaClient } from "../layout/supa-client";
import { UserContext } from "../layout/App";
import Avatar from './Avatar';
import './Profile.css';
import { CountryDropdown } from "../shared/CountryDropdown";

export default function UserProfile() {
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [website, setWebsite] = useState(null);
  const [bio, setBio] = useState('');
  const [avatar_url, setAvatarUrl] = useState(null);
  const { session, profile, updateProfile } = useContext(UserContext);
  const [pageError, setPageError] = useState(null);
  const [usernameError, setUsernameError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showMoreError, setShowMoreError] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const defaultAvatars = [
    { name: 'dove', url: '0.6161512621186469.jpg' },
    { name: 'feather', url: '0.27244231307398037.jpg' },
    { name: 'peace', url: '0.6879050797391486.jpg' },
  ];

  useEffect(() => {
    let ignore = false;
    async function getProfile() {
      setLoading(true);
      const { data, error } = await supaClient
        .from('user_profiles')
        .select('username, website, avatar_url, country, state_province, city, bio, birthday, full_name')
        .eq('username', profile.username)
        .single();

      if (!ignore) {
        if (error) {
          console.warn(error.message);
          setPageError(error.message);
        } else if (data) {
          setUsername(data.username);
          setWebsite(data.website);
          setAvatarUrl(data.avatar_url);
          setCountry(data.country);
          setSelectedCountry(data.country);
          setState(data.state_province);
          setCity(data.city);
          setBirthday(data.birthday);
          setBio(data.bio);
          setFullName(data.full_name);
        }
      }
      setLoading(false);
    }
    if (!profile) return;

    getProfile();
    return () => { ignore = true; };
  }, [session, profile]);

  async function updateProfileInfo(event, avatarUrl) {
    event.preventDefault();
    if (bio?.length > 500) {
      setSubmitError('Bio is too long.')
      return;
    }
    setLoading(true);
    const { user } = session;
    const updates = {
      user_id: user?.id,
      username,
      full_name: fullName,
      website,
      avatar_url: avatarUrl ? avatarUrl : avatar_url,
      updated_at: new Date(),
      state_province: state,
      city,
      country: country ? country : selectedCountry,
      bio,
      birthday
    };
    const { error } = await supaClient.from('user_profiles').upsert(updates);
    if (error) {
        setUsernameError(error.message);
        setUsername(profile.username);

    } else {
      setAvatarUrl(avatarUrl);
      updateProfile({ username });
    }
    setLoading(false);
  }

  async function uploadAvatar(event) {
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    setUploading(true);
    const { error } = await supaClient.storage.from('avatars').upload(fileName, file);
    if (error) {
      console.error('Error uploading avatar:', error.message);
    } else {
      updateProfileInfo(event, fileName);
    }
    setUploading(false);
  }

  async function deleteAvatarForUser() {
    const { user } = session;
    const target_user_id = user.id;
    if (user.id && avatar_url) {
      const { error: rpcError } = await supaClient.storage.from('avatars').remove([avatar_url]);
      if (rpcError) {
        console.error('Error:', rpcError.message);
      } else {
        const { error: updateError } = await supaClient.from('user_profiles').update({ avatar_url: null }).eq('user_id', target_user_id);
        if (updateError) {
          console.error('Error updating user profile:', updateError.message);
        }
        setAvatarUrl(null);
      }
    }
  }

  return (
    <>
      {pageError && <p>Sorry, unable to find user named {profileName}.</p>}
      {loading && <p>Loading profile...</p>}
      {!loading && !pageError && (
        <form onSubmit={updateProfileInfo} className="form-widget">
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="text" value={session?.user.email} disabled />
          </div>
          <div>
            <label htmlFor="username">User Name</label>
            <input
              id="username"
              type="text"
              required
              value={username || ''}
              onChange={(e) => setUsername(e.target.value)}
              disabled
            />
            {usernameError && <p className="error">Error: That username is already taken. Details: </p>}
            {usernameError && <p className="error-text">{usernameError}</p>}
          </div>
          <h4 className="profile-picture-header">Profile Picture</h4>
          <Avatar
            url={avatar_url}
            size={150}
            deleteAvatar={deleteAvatarForUser}
          />
          <div className="default-avatars">
            <h4 className="settings-header">Select or Upload a Profile Picture</h4>
            <div className="avatar-container">
              {defaultAvatars.map((avatar) => (
                <img
                  key={avatar.name}
                  src={`http://127.0.0.1:54321/storage/v1/object/public/default_avatars/${avatar.url}`}
                  alt={avatar.name}
                  className="default-avatar"
                  onClick={() => setAvatarUrl(avatar.url)}
                />
              ))}
              <div className="upload-avatar-wrapper">
                <div className="default-avatar upload-avatar">
                  <label htmlFor="upload-input" className="upload-label">
                    +
                    <input
                      type="file"
                      id="upload-input"
                      accept="image/*"
                      onChange={uploadAvatar}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <p className="upload-text">Upload</p>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={fullName || ''}
              onChange={(e) => setFullName(e.target.value)}
            />
            <div className="name-recommendation-text">Gather Peace recommends using your real name, or real initials, such as "John S.",
              as the project becomes more significant by emphasizing interactions between real people. This is optional.
              </div>
          </div>
          <CountryDropdown
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            country={country}
            setCountry={setCountry}
            state={state}
            city={city}
            setState={setState}
            setCity={setCity}
          />
          <div>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio || ''}
              onChange={(e) => setBio(e.target.value)}
              rows="5"
            />
            <p className="character-counter">{bio?.length}/500</p>
            {bio?.length > 500 && <p className="error-text">Bio cannot exceed 500 characters</p>}
          </div>
          <div>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              value={website || ''}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className="input-container">
            <label htmlFor="birthday">Birthday</label>
            <input
              id="birthday"
              type="date"
              value={birthday || ''}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>
          {submitError && <div className="error-text">{submitError}</div>}
          <div>
            <button className="action-button width-125" type="submit" disabled={loading}>
              {loading ? 'Loading ...' : 'Save Changes'}
            </button>
          </div>
          <div>
            <button className="action-button sign-out-button width-125" type="button" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </button>
          </div>
        </form>
      )}
    </>
  );
}
