import React, { useEffect, useState } from 'react';
import { supaClient } from "../layout/supa-client";
import './trending.css'

export function TrendingTags() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);

    useEffect(() => {
        const fetchTrendingTags = async () => {
          try {
            const { data, error } = await supaClient
                .from('trending_tags_view')
                .select('*')
                .order('frequency', { ascending: false });

            if (error) {
                console.log('error in error block: ' + error);
            } if (data) {
              setTags(data);
              console.log('tags: ' + JSON.stringify(data));
            }


        } catch (error) {
            console.log('error fetching tags: ' + JSON.stringify(error));

        }
        setLoading(!loading);
        };

        fetchTrendingTags();
    }, []);

    if (loading) return <p>Loading trending tags...</p>;
    if (pageError) return <p>Error fetching trending tags: {error}</p>;

    return (
      <div className="trending-tags-container">
          <h2>Trending Tags (Last 7 Days)</h2>
          <div className="trending-tags">
              {tags.length > 0 ? (
                  tags.map((tag, index) => (
                      <div className="tag-item" key={index}>
                          {tag.tag} - {tag.frequency} {tag.frequency > 1 ? 'posts' : 'post'}
                      </div>
                  ))
              ) : (
                  <p>No trending tags available.</p>
              )}
          </div>
      </div>
    );
}
