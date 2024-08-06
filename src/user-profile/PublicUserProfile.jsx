import React, { useEffect, useState } from 'react';
import { supaClient } from '../layout/supa-client';
import Avatar from './Avatar';
import { CountryDropdown } from '../shared/CountryDropdown';

export default function PublicUserProfile({ profileName }) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [pageError, setPageError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function getProfile() {
      setLoading(true);
      const { data, error } = await supaClient
        .from('user_profiles')
        .select('username, website, avatar_url, country, state_province, city, full_name, bio, birthday')
        .eq('username', profileName)
        .single();

      if (!ignore) {
        if (error) {
          console.warn(error.message);
          setPageError(error.message);
        } else if (data) {
          console.log('profile Data: ' + JSON.stringify(data));
          setProfileData(data);
        }
      }
      setLoading(false);
    }

    if (profileName) {
      getProfile();
    }

    return () => { ignore = true; };
  }, [profileName]);

  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (pageError) {
    return <p>Sorry, unable to find user named {profileName}.</p>;
  }

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!profileData) {
    return null;
  }

  const formatWebsiteUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`;
  };

  return (
    <div className="public-profile">
      <h2>{profileData.username}</h2>
      <Avatar url={profileData.avatar_url} size={150} profileIsPublic={true}/>
      {profileData.full_name && (
        <div className="input-container">
          <label>Full Name</label>
          <p>{profileData.full_name}</p>
        </div>
      )}
      {profileData.bio && (
        <div className="input-container">
          <label>Bio</label>
          <p>{profileData.bio}</p>
        </div>
      )}

      {profileData.country && (
        <div className="input-container">
          <label>Country</label>
          <p>{profileData.country}</p>
        </div>
      )}
      {profileData.state_province && (
        <div className="input-container">
          <label>State/Province</label>
          <p>{profileData.state_province}</p>
        </div>
      )}
      {profileData.city && (
        <div className="input-container">
          <label>City</label>
          <p>{profileData.city}</p>
        </div>
      )}
      {profileData.birthday && (
        <div className="input-container">
          <label>Age</label>
          <p>{calculateAge(profileData.birthday)} years old</p>
        </div>
      )}
      {profileData.website && (
        <div className="input-container">
          <label>Website</label>
          <a href={formatWebsiteUrl(profileData.website)} target="_blank" rel="noopener noreferrer">
            <p>{profileData.website || 'Not Specified'}</p>
          </a>
        </div>
      )}
    </div>
  );
}
