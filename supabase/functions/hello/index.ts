import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.js";
import { getMetaTags } from "https://deno.land/x/opengraph/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Utility function to prioritize tags
const getDomainFromUrl = (url: string) => {
  return url; // Keep http(s) and capitalization as-is
};

// Utility function to prioritize tags with fallback
const getTag = (...tags: any[]) => {
  // Return the first truthy, non-empty value
  return tags.find((tag) => tag && typeof tag === "string" && tag.trim() !== "");
};


// Function to structure the metadata into an object
const buildLinkPreview = (metaData: any, externalLink: string) => {
  // Prioritize tags based on metaData and fallbacks
  return {
    title: getTag(
      metaData?.og?.title,
      metaData?.twitter?.title,
      metaData?.title,
      externalLink // Use the URL itself if no title is found
    ),
    description: getTag(
      metaData?.og?.description,
      metaData?.twitter?.description,
      metaData?.description
    ),
    image: getTag(
      metaData?.twitter?.image,
      metaData?.og?.image,
      null // Fallback if no image exists
    ),
    site_name: getTag(
      metaData?.og?.site_name,
      metaData?.twitter?.site,
      metaData?.keywords
    ),
  };
};

// Serve the function
serve(async (req) => {

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  if (req.method === 'OPTIONS') {

    return new Response('ok', { headers: corsHeaders });
  }

  const writeLinkDataToDB = async (preview: any, url: string) => {
    console.log('Writing data to DB:', JSON.stringify(preview));
    console.log('this is the image: ' + preview.image);
    const record = {
      url,
      title: preview.title,
      description: preview.description, // If description is null, it will insert null
      image_location: preview.image,
    };

    const { data, error } = await supabaseClient
      .from('link_previews')
      .insert([record]);

      console.log('Insert Result:', { data, error });

    if (error) {
      console.error('Error writing data to DB:', error.message);
    } else {
    }
  };

  try {

    const { externalLink } = await req.json();


    // Fetch all meta tags

    const metaData = await getMetaTags(externalLink);
    console.log('Fetched metaData:', JSON.stringify(metaData));
    for (const key in metaData) {
      console.log('Key:', key, 'Value:', metaData[key]);
    }
    console.log('meta image: ' + metaData.image);


    // Build the link preview based on the priority of tags
    const linkPreview = buildLinkPreview(metaData, externalLink);


    // Respond to the user right away with the preview data
    const response = new Response(JSON.stringify(linkPreview), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

    // Write fetched data to the database asynchronously
    writeLinkDataToDB(linkPreview, externalLink);

    // Return the response immediately
    return response;

  } catch (error) {
    console.error('An error occurred:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
