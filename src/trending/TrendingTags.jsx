import React, { useEffect, useState } from 'react';
import { supaClient } from "../layout/supa-client";
import './trending.css';
import { Link } from "react-router-dom";

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
                    setPageError(error.message);
                } else if (data) {
                    const validTags = data.filter(tag => tag.tag && tag.tag.trim() !== '');  // Filter out empty or invalid tags
                    setTags(validTags);
                }
            } catch (error) {
                console.log('error fetching tags: ' + JSON.stringify(error));
                setPageError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingTags();
    }, []);

    if (loading) return <p>Loading trending tags...</p>;
    if (pageError) return <p>Error fetching trending tags: {pageError}</p>;

return (
    <>
        {tags.length > 0 && (
            <div className="trending-tags-container">
                <div className="trending-tags">
                    {tags.map((tag, index) => (
                        <Link key={index} to={`/peace-wall/1?query=%23${tag.tag.slice(1)}`}>
                            <div className="tag-item">
                                {/* {tag.tag} - {tag.frequency} {tag.frequency > 1 ? 'posts' : 'post'} */}
                                {tag.tag}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}
    </>
);
}
