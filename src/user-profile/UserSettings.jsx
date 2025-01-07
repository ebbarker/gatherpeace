import React, { useState, useEffect, useContext } from 'react';
import { supaClient } from '../layout/supa-client';
import { UserContext } from '../layout/App';
import './UserSettings.css'; // Ensure the CSS is imported

export default function UserSettings() {
  const { session } = useContext(UserContext);
  const [allowSharing, setAllowSharing] = useState(false);
  const [creditText, setCreditText] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [allowArtSharing, setAllowArtSharing] = useState(false);
  const [socialUrls, setSocialUrls] = useState(['']);
  const [featureOnHomepage, setFeatureOnHomepage] = useState(false);
  const [homepageCreditText, setHomepageCreditText] = useState('');
  const [userComments, setUserComments] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPreferences();
    }
  }, [session]);

  // Fetch existing preferences from the database
  const fetchUserPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supaClient
        .from('user_preferences')
        .select(
          'allow_sharing, credit_text, newsletter_opt_in, allow_art_sharing, social_urls, feature_on_homepage, homepage_credit_text, user_comments'
        )
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          console.log('No user preferences found. Initializing with default values.');
        } else {
          console.error('Error fetching user preferences:', error.message);
        }
      } else if (data) {
        setAllowSharing(data.allow_sharing || false);
        setCreditText(data.credit_text || '');
        setNewsletterOptIn(data.newsletter_opt_in || false);
        setAllowArtSharing(data.allow_art_sharing || false);
        setSocialUrls(data.social_urls && data.social_urls.length > 0 ? data.social_urls : ['']);
        setFeatureOnHomepage(data.feature_on_homepage || false);
        setHomepageCreditText(data.homepage_credit_text || '');
        setUserComments(data.user_comments || '');
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update preferences in the database
  const updatePreferences = async () => {
    setLoading(true);
    try {
      const { error } = await supaClient.from('user_preferences').upsert(
        {
          user_id: session.user.id,
          allow_sharing: allowSharing,
          credit_text: allowSharing ? creditText : '',
          newsletter_opt_in: newsletterOptIn,
          allow_art_sharing: allowArtSharing,
          social_urls: allowArtSharing ? socialUrls.filter((url) => url !== '') : null,
          feature_on_homepage: featureOnHomepage,
          homepage_credit_text: featureOnHomepage ? homepageCreditText : '',
          user_comments: userComments,
        },
        { onConflict: 'user_id' } // Specify the conflict target
      );

      if (error) {
        console.error('Error updating preferences:', error.message);
        alert('There was an error saving your preferences. Please try again.');
      } else {
        alert('Preferences updated successfully!');
      }
    } catch (error) {
      console.error('Error updating preferences:', error.message);
      alert('There was an error saving your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSocialUrl = () => {
    setSocialUrls([...socialUrls, '']);
  };

  // Updated function to handle removal of social URLs
  const removeSocialUrl = (index) => {
    if (socialUrls.length === 1 && index === 0) {
      // If it's the only item and the first index, clear the content
      setSocialUrls(['']);
    } else {
      const updatedUrls = [...socialUrls];
      updatedUrls.splice(index, 1);
      setSocialUrls(updatedUrls);
    }
  };

  const handleSocialUrlChange = (index, value) => {
    const updatedUrls = [...socialUrls];
    updatedUrls[index] = value;
    setSocialUrls(updatedUrls);
  };

  return (
    <div className="user-settings-form">
      {loading ? (
        <p>Loading preferences...</p>
      ) : (
        <>
          <h2 className="user-settings-title">User Preferences</h2>

          <div className="user-settings-grid">
            {/* Share posts on social media */}
            <div className="user-settings-prompt">
              Can Gather Peace share your posts on social media?
            </div>
            <div className="user-settings-checkbox">
              <input
                type="checkbox"
                checked={allowSharing}
                onChange={(e) => setAllowSharing(e.target.checked)}
              />
            </div>

            {/* How to be credited for posts */}
            {allowSharing && (
              <>
                <div className="user-settings-prompt">
                  Please provide the name you'd like to be credited by:
                  <div className="user-settings-examples">
                    Examples: anonymous, full name, initials, etc.
                  </div>
                </div>
                <div className="user-settings-input">
                  <input
                    type="text"
                    placeholder="Your preferred name for credit"
                    value={creditText}
                    onChange={(e) => setCreditText(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Newsletter opt-in */}
            <div className="user-settings-prompt">Opt-in to our newsletter?</div>
            <div className="user-settings-checkbox">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
              />
            </div>

            {/* Share art on social media */}
            <div className="user-settings-prompt">
              Can Gather Peace share your art or images on social media?
            </div>
            <div className="user-settings-checkbox">
              <input
                type="checkbox"
                checked={allowArtSharing}
                onChange={(e) => setAllowArtSharing(e.target.checked)}
              />
            </div>

            {/* Social media URLs */}
            {allowArtSharing && (
              <>
                {socialUrls.map((url, index) => (
                  <React.Fragment key={index}>
                    <div className="user-settings-prompt">
                      <input
                        type="text"
                        placeholder="Your social profile URL"
                        value={url}
                        onChange={(e) => handleSocialUrlChange(index, e.target.value)}
                      />
                      <button
                        type="button"
                        className="remove-line"
                        onClick={() => removeSocialUrl(index)}
                      >
                        X
                      </button>
                    </div>
                    {/* Empty grid cell to maintain alignment */}
                    <div className="user-settings-checkbox"></div>
                  </React.Fragment>
                ))}
                <div className="user-settings-prompt">
                  <button
                    type="button"
                    className="action-button"
                    onClick={addSocialUrl}
                  >
                    Add Another
                  </button>
                </div>
                {/* Empty grid cell to maintain alignment */}
                <div className="user-settings-checkbox"></div>
              </>
            )}

            {/* Feature art on homepage */}
            <div className="user-settings-prompt">
              Can Gather Peace feature your art on the homepage?
            </div>
            <div className="user-settings-checkbox">
              <input
                type="checkbox"
                checked={featureOnHomepage}
                onChange={(e) => setFeatureOnHomepage(e.target.checked)}
              />
            </div>

            {/* How to be credited for homepage feature */}
            {featureOnHomepage && (
              <>
                <div className="user-settings-prompt">
                  Please provide the name you'd like to be credited by on the homepage:
                  <div className="user-settings-examples">
                    Examples: anonymous, full name, initials, etc.
                  </div>
                </div>
                <div className="user-settings-input">
                  <input
                    type="text"
                    placeholder="Your preferred name for homepage credit"
                    value={homepageCreditText}
                    onChange={(e) => setHomepageCreditText(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* User comments */}
            <div className="user-settings-prompt">Any comments or feedback for us?</div>
            <div className="user-settings-input">
              <textarea
                placeholder="Your comments"
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                rows={4}
              ></textarea>
            </div>
          </div>

          {/* Save Preferences Button */}
          <div className="user-settings-button">
            <button
              onClick={updatePreferences}
              className="action-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
