import React, { useState, useEffect } from 'react';
import './LinkPreview.css'; // Importing the CSS file
import { supaClient } from "../layout/supa-client";

export default function LinkPreview({ text }) {
    const [ogPreview, setOgPreview] = useState(null);
    const [noOgPreview, setNoOgPreview] = useState(false);

    useEffect(() => {
      if (text?.length && !noOgPreview) {
        checkDbForMetadata(text);
      }
    }, [text]);

    // Function to extract the domain and preserve the original case, no changes to capitalization
  const extractDomain = (url) => {
    const domain = url.replace(/(^\w+:|^)\/\//, ''); // Remove http/https
    return domain;  // Return the domain without modifications
  };


    // Function to check DB for metadata first
    async function checkDbForMetadata(text) {
      const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      const arr = text.match(urlRegex);
      const url = arr?.length ? arr[0] : null;



      if (!url) {
        setNoOgPreview(true);
        return;
      }

      try {
        const { data, error } = await supaClient
          .from('link_previews')
          .select('*')
          .eq('url', url)
          .single();

        if (error && error.code === 'PGRST116') {
          console.log('No data found in DB, calling edge function...');
          fetchOgDataFromEdgeFunction(url);
        } else if (data) {
          setOgPreview({
            url: extractDomain(url),  // Add extracted domain without modifying case
            title: data.title || extractDomain(url),
            description: data.description,
            image: data.image_location,
          });
        }
      } catch (dbError) {
        console.log('DB Error:', dbError.message);
        setNoOgPreview(true);
      }
    }

    async function fetchOgDataFromEdgeFunction(url) {
      try {
        const { data, error } = await supaClient.functions.invoke('hello', {
          body: JSON.stringify({ externalLink: url }),
        });

        if (error) {
          console.log('Error invoking edge function:', error.message);
          return;
        } else {
          console.log('Edge Function Response:', JSON.stringify(data));
        }

        setOgPreview({
          url: extractDomain(url),  // Add extracted domain without modifying case
          title: data?.preview?.title || extractDomain(url),
          description: data?.preview?.description || '',
          image: data?.preview?.image || '',
        });

       // saveMetadataToDB(data, url);
      } catch (fetchError) {
        console.log('Edge Function Error:', fetchError.message);
      }
    }

    // async function saveMetadataToDB(metadata, url) {
    //   try {
    //     const { data, error } = await supaClient
    //       .from('link_previews')
    //       .insert([
    //         {
    //           url: url,
    //           title: metadata.title || extractDomain(url),
    //           description: metadata.description,
    //           image_location: metadata.image_location,
    //         },
    //       ]);

    //     if (error) {
    //       console.log('Error saving metadata to DB:', error.message);
    //     } else {
    //       console.log('Metadata saved to DB:', data);
    //     }
    //   } catch (dbError) {
    //     console.log('Error inserting data into DB:', dbError.message);
    //   }
    // }

    if (!ogPreview) return null;

    return (
        <a
          href={ogPreview.url.startsWith("http") ? ogPreview.url : `https://${ogPreview.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-preview"
        >
          {ogPreview.image && (
            <div className="preview-image-container">
              <img src={ogPreview.image} alt="Preview" className="preview-image" />
            </div>
          )}
          <div className="preview-text">
            <p className="preview-url">{ogPreview.url}</p>
            <h3 className="preview-title">{ogPreview.title}</h3>
            <p className="preview-description">{ogPreview.description}</p>
          </div>
        </a>
    );
  }
