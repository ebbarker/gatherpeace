import { useState, useEffect, useContext, useCallback } from 'react';
import { supaClient } from "../layout/supa-client";
import { UserContext } from "../layout/App";
import Avatar from './Avatar';
import './Profile.css';
import { CountryDropdown } from "../shared/CountryDropdown";
import { useNavigate, UNSAFE_NavigationContext } from 'react-router-dom';
import { unstable_useBlocker as useBlocker, useBeforeUnload } from 'react-router-dom';

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
  const [selectedCountry, setSelectedCountry] = useState('--Select a country--');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = useCallback(
    (setter) => (e) => {
      setter(e.target.value);
      setHasUnsavedChanges(true);
    },
    []
  );

  // Handle browser navigation (refresh, close tab)
    useBeforeUnload(
    (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    hasUnsavedChanges
  );

function usePrompt(message, when) {
    const blocker = useBlocker(when);

    useEffect(() => {
      if (blocker.state === 'blocked') {
        const proceed = window.confirm(message);
        if (proceed) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      }
    }, [blocker, message, when]);
  }

  usePrompt('You have unsaved changes, are you sure you want to leave?', hasUnsavedChanges);

  const defaultAvatars = [
    { name: 'dove', url: '/default_avatars/dove.jpg' },
    { name: 'feather', url: '/default_avatars/feather.jpg' },
    { name: 'peace', url: '/default_avatars/peace.jpg' },
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

// UserProfile.jsx

async function updateProfileInfo(event, newAvatarUrl) {
  event.preventDefault();
  if (bio?.length > 500) {
    setSubmitError('Bio is too long.');
    return;
  }
  setLoading(true);
  const { user } = session;
  const updates = {
    user_id: user?.id,
    username,
    full_name: fullName,
    website,
    avatar_url: newAvatarUrl !== undefined ? newAvatarUrl : avatar_url,
    updated_at: new Date(),
    state_province: state,
    city,
    country: country || selectedCountry,
    bio,
    birthday,
  };
  const { error } = await supaClient.from('user_profiles').upsert(updates);
  if (error) {
    setUsernameError(error.message);
    setUsername(profile.username);
  } else {
    setAvatarUrl(updates.avatar_url);
    updateProfile({ username });
    setHasUnsavedChanges(false); // Reset unsaved changes
  }
  setLoading(false);
}


  async function uploadAvatar(event) {
    const { user } = session;
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.session?.user.id}-${Date.now()}.${fileExt}`;
    const bucket = "avatars";
    setUploading(true);

    // Upload the avatar to Supabase Storage
    const { error: uploadError } = await supaClient.storage.from(bucket).upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError.message);
      setUploading(false);
      return;
    }

    // Update the user's profile with the new avatar URL
    const newAvatarUrl = fileName;
    await updateAvatarInProfile(newAvatarUrl);

    setUploading(false);
  }

async function deleteAvatarForUser() {
  const { user } = session;
  const target_user_id = user.id;
  if (user.id && avatar_url) {
    if (!avatar_url.startsWith('/')) {
      // It's a user-uploaded avatar stored in Supabase storage
      const { error: rpcError } = await supaClient.storage.from('avatars').remove([avatar_url]);
      if (rpcError) {
        console.error('Error:', rpcError.message);
        return;
      }
    }
    // Update the user profile to remove avatar_url
    const { error: updateError } = await supaClient
      .from('user_profiles')
      .update({ avatar_url: null })
      .eq('user_id', target_user_id);
    if (updateError) {
      console.error('Error updating user profile:', updateError.message);
    }
    setAvatarUrl(null);
  }
}

  const handleAvatarSelection = (selectedAvatarUrl) => {
    setAvatarUrl(selectedAvatarUrl);
    updateAvatarInProfile(selectedAvatarUrl);
  };

const updateAvatarInProfile = async (newAvatarUrl) => {
  setUploading(true);
  const { user } = session;

  // Update only the avatar_url field for the current user
  const { error } = await supaClient
    .from('user_profiles')
    .update({ avatar_url: newAvatarUrl, updated_at: new Date() })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating avatar:', error.message);
  } else {
    setAvatarUrl(newAvatarUrl);
    updateProfile({ avatar_url: newAvatarUrl });
  }
  setUploading(false);
};

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
              onChange={handleInputChange(setUsername)}
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
                  src={`${avatar.url}`}
                  alt={avatar.name}
                  className="default-avatar"
                  onClick={() => handleAvatarSelection(avatar.url)}
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
              onChange={handleInputChange(setFullName)}
            />
            <div className="name-recommendation-text">
              Gather Peace recommends using your real name, or real initials, such as "John S.",
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
            setHasUnsavedChanges={setHasUnsavedChanges}
          />
          <div>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio || ''}
              onChange={handleInputChange(setBio)}
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
              onChange={handleInputChange(setWebsite)}
            />
          </div>
          <div className="input-container">
            <label htmlFor="birthday">Birthday</label>
            <input
              id="birthday"
              type="date"
              value={birthday || ''}
              onChange={handleInputChange(setBirthday)}
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
