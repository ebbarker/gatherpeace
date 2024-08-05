import { useState, useEffect, useContext } from 'react'
import { supaClient } from "../layout/supa-client";
import { UserContext } from "../layout/App";
import Avatar from './Avatar'

// export default function UserProfile() {
//   const [profileName, setProfileName] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [username, setUsername] = useState(null);
//   const [website, setWebsite] = useState(null);
//   const [avatar_url, setAvatarUrl] = useState(null);
//   const { session, profile, updateProfile } = useContext(UserContext);
//   const [ pageError, setPageError ] = useState(null);
//   const [usernameError, setUsernameError] = useState(null);
//   const doveUrl = "dove.jpg"



//   useEffect(() => {
//     // Example usage

//     let ignore = false
//     async function getProfile() {
//       setLoading(true)
//      // const { username } = session

//       const { data, error } = await supaClient
//         .from('user_profiles')
//         .select(`username, website, avatar_url`)
//         .eq('username', profile.username)
//         .single()

//       if (!ignore) {
//         if (error) {
//           console.warn(error);
//           console.warn(error.message);
//           console.warn(error.details);
//           setPageError(error.message);
//         } else if (data) {
//           console.log('avatar url: ' + typeof data.avatar_url);
//           setUsername(data.username)
//           setWebsite(data.website)
//           setAvatarUrl(data.avatar_url)
//         }
//       }
//       setLoading(false);
//     }

//     getProfile()

//     return () => {
//       ignore = true
//     }
//   }, [session, profile])


//   async function updateProfileInfo(event, avatarUrl) {
//     console.log('updating...');
//     event.preventDefault();

//     setLoading(true);
//     const { user } = session;

//     const updates = {
//       user_id: user?.id,
//       username,
//       website,
//       avatar_url: avatarUrl ? avatarUrl : avatar_url,
//       updated_at: new Date(),
//     }

//     console.log('updating with ', JSON.stringify(updates));

//     const { error } = await supaClient.from('user_profiles').upsert(updates);

//     if (error) {
//       console.log(error.message)
//       //if error, set username to old username and display unique error
//       if (error.message.includes('violates unique')) {
//         setUsernameError(error.message);
//         setUsername(profile.username);
//       }
//     } else {
//       setAvatarUrl(avatarUrl);
//       updateProfile({ username });
//     }
//     setLoading(false);
//   }

// async function deleteAvatarForUser() {
//     const { user } = session;
//     const target_user_id = user.id;
//     console.log('user id: ' + user.id);
//     console.log('target user id: ' + target_user_id);
//     console.log('avatar url: ' + avatar_url);

//     try {
//         if (user.id && avatar_url) {
//             // Call to delete the storage object
//             const { data: messageData, error: rpcError } = await supaClient
//                 .storage
//                 .from('avatars')
//                 .remove([avatar_url]);

//             if (rpcError) {
//                 console.error('error: ' + rpcError.message);
//                 return { error: rpcError.message };
//             } else {
//                 console.log('success: ' + JSON.stringify(messageData));
//                 // If the storage object deletion succeeds, update the user_profiles table
//                 const { data: updateData, error: updateError } = await supaClient
//                     .from('user_profiles')
//                     .update({ avatar_url: null }) // Set avatar_url to NULL
//                     .eq('user_id', target_user_id); // For the current user

//                 if (updateError) {
//                     console.error('error updating user profile: ' + updateError.message);
//                     return { error: updateError.message };
//                 }
//                 setAvatarUrl(null);
//                 console.log('user profile updated successfully: ' + JSON.stringify(updateData));
//             }

//             return { success: true, message: 'Avatar deleted successfully' };
//         } else {
//             return { error: 'Avatar URL not found for the given user.' };
//         }
//     } catch (error) {
//         console.error('Error deleting avatar:', error);
//         return { error: 'An unexpected error occurred.' };
//     }
// }

//   // Usage example:

//   return (
//     <>
//     { pageError && <p>Sorry, unable to find user named {profileName}.</p>}


//     { (loading
//       && <p>Loading profile...</p>)
//     }
//     { (!loading && !pageError &&
//       <form onSubmit={updateProfileInfo} className="form-widget">
//       <div>
//         <label htmlFor="email">Email</label>
//         <input id="email" type="text" value={session?.user.email} disabled />

//       </div>
//       <div>
//         <label htmlFor="username">User Name</label>
//         <input
//           id="username"
//           type="text"
//           required
//           value={username || ''}
//           onChange={(e) => setUsername(e.target.value)}
//         />
//         {usernameError && <p className="error">Error: That username is already taken. Details: </p>}
//         {usernameError && <p className="error-text">{usernameError}</p>}
//       </div>
//       <h3>Profile Picture</h3>
//       <Avatar
//         url={avatar_url}
//         size={150}
//         onUpload={(event, url) => {
//           updateProfileInfo(event, url)
//         }}
//         deleteAvatar={() => {
//           deleteAvatarForUser()
//         }}
//       />
//       <div>
//         <label htmlFor="website">Website</label>
//         <input
//           id="website"
//           type="url"
//           value={website || ''}
//           onChange={(e) => setWebsite(e.target.value)}
//         />
//       </div>

//       <div>
//         <button className="button block primary" type="submit" disabled={loading}>
//           {loading ? 'Loading ...' : 'Update'}
//         </button>
//       </div>

//       <div>
//         <button className="button block" type="button" onClick={() => supabase.auth.signOut()}>
//           Sign Out
//         </button>
//       </div>
//     </form>
//   )}
//   </>
//   )
// }

// export default function UserProfile() {
//   const [profileName, setProfileName] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [username, setUsername] = useState(null);
//   const [website, setWebsite] = useState(null);
//   const [avatar_url, setAvatarUrl] = useState(null);
//   const { session, profile, updateProfile } = useContext(UserContext);
//   const [pageError, setPageError] = useState(null);
//   const [usernameError, setUsernameError] = useState(null);
//   // Add a list of default avatar URLs
//   const defaultAvatars = [
//     'dove',
//     // '/path/to/default-avatar2.png',
//     // '/path/to/default-avatar3.png',
//     // '/path/to/default-avatar4.png',
//     // '/path/to/default-avatar5.png',
//   ];
//   // This state is for keeping track of the selected default avatar
//   const [selectedAvatar, setSelectedAvatar] = useState(null);

//   useEffect(() => {
//     let ignore = false;
//     async function getProfile() {
//       setLoading(true);

//       const { data, error } = await supaClient
//         .from('user_profiles')
//         .select(`username, website, avatar_url`)
//         .eq('username', profile.username)
//         .single();

//       if (!ignore) {
//         if (error) {
//           console.warn(error);
//           setPageError(error.message);
//         } else if (data) {
//           setUsername(data.username);
//           setWebsite(data.website);
//           setAvatarUrl(data.avatar_url);
//         }
//       }

//       setLoading(false);
//     }

//     getProfile();

//     return () => {
//       ignore = true;
//     };
//   }, [session, profile]);

//   async function updateProfileInfo(event) {
//     event.preventDefault();

//     setLoading(true);
//     const { user } = session;

//     const updates = {
//       user_id: user?.id,
//       username,
//       website,
//       avatar_url: selectedAvatar ? selectedAvatar : avatar_url,
//       updated_at: new Date(),
//     };

//     const { error } = await supaClient.from('user_profiles').upsert(updates);

//     if (error) {
//       console.log(error.message);
//       if (error.message.includes('violates unique')) {
//         setUsernameError(error.message);
//         setUsername(profile.username);
//       }
//     } else {
//       setAvatarUrl(selectedAvatar ? selectedAvatar : avatar_url);
//       updateProfile({ username });
//     }
//     setLoading(false);
//   }

//   async function deleteAvatarForUser() {
//     // Your existing deleteAvatarForUser function
//   }

//   function onUpload (event, url) {
//     updateProfileInfo(event, url);
//   }

//   // Function to handle avatar selection
//   const handleAvatarSelect = (avatarUrl) => {
//     setSelectedAvatar(avatarUrl);
//   };

//   return (
//     <>
//       {pageError && <p>Sorry, unable to find user named {profileName}.</p>}
//       {loading && <p>Loading profile...</p>}
//       {!loading && !pageError && (
//         <form onSubmit={updateProfileInfo} className="form-widget">
//           <div>
//             <label htmlFor="email">Email</label>
//             <input id="email" type="text" value={session?.user.email} disabled />
//           </div>
//           <div>
//             <label htmlFor="username">User Name</label>
//             <input
//               id="username"
//               type="text"
//               required
//               value={username || ''}
//               onChange={(e) => setUsername(e.target.value)}
//             />
//             {usernameError && <p className="error">Error: That username is already taken. Details: </p>}
//             {usernameError && <p className="error-text">{usernameError}</p>}
//           </div>
//           <div>
//             <label>Select an Avatar</label>
//             {/* <div>
//               {defaultAvatars.map((avatar, index) => (
//                 <Avatar
//                   key={index}
//                   url={avatar}
//                   size={150}
//                   onSelect={() => handleAvatarSelect(avatar)}
//                   className={selectedAvatar === avatar ? 'selected-avatar' : ''}
//                 />
//               ))}
//             </div> */}
//           </div>
//           <Avatar
//             url={avatar_url}
//             size={150}
//             onUpload={onUpload}
//             deleteAvatar={() => deleteAvatarForUser()}
//           />
//           <div>
//             <label htmlFor="website">Website</label>
//             <input
//               id="website"
//               type="url"
//               value={website || ''}
//               onChange={(e) => setWebsite(e.target.value)}
//             />
//           </div>
//           <div>
//             <button className="button block primary" type="submit" disabled={loading}>
//               {loading ? 'Loading ...' : 'Update'}
//             </button>
//           </div>
//           <div>
//             <button className="button block" type="button" onClick={() => supabase.auth.signOut()}>
//               Sign Out
//             </button>
//           </div>
//         </form>
//       )}
//     </>
//   );
// }


// import React, { useContext, useEffect, useState } from 'react';
// import { supaClient } from './supa-client';
// import { UserContext } from './App';
// import Avatar from './Avatar';

import './Profile.css';
import { CountryDropdown } from "../shared/CountryDropdown";

export default function UserProfile() {
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [website, setWebsite] = useState(null);
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
        .select('username, website, avatar_url, country, state_province, city')
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
    setLoading(true);
    const { user } = session;
    const updates = {
      user_id: user?.id,
      username,
      website,
      avatar_url: avatarUrl ? avatarUrl : avatar_url,
      updated_at: new Date(),
      state_province: state,
      city,
      country: country ? country : selectedCountry
    };
    const { error } = await supaClient.from('user_profiles').upsert(updates);
    if (error) {
      if (error.message.includes('violates unique')) {
        setUsernameError(error.message);
        setUsername(profile.username);
      }
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
            />
            {usernameError && <p className="error">Error: That username is already taken. Details: </p>}
            {usernameError && <p className="error-text">{usernameError}</p>}
          </div>
          <h4 className="settings-header">Profile Picture</h4>
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
            <label htmlFor="website">Website</label>
            <input
              id="website"
              value={website || ''}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div>
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? 'Loading ...' : 'Save Changes'}
            </button>
          </div>
          <div>
            <button className="button" type="button" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </button>
          </div>
        </form>
      )}
    </>
  );
}