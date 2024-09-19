import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.js";
import { getMetaTags } from "https://deno.land/x/opengraph/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Utility function to prioritize tags
const getDomainFromUrl = (url: string) => {
  return url; // Keep http(s) and capitalization as-is
};

// Utility function to prioritize tags with fallback
const getTag = (primary: any, fallback1: any, fallback2: any, fallback3: any, externalLink: string = null) => {
  return primary || fallback1 || fallback2 || fallback3 || externalLink; // Keep URL as it is if no title is found
};

// Function to structure the metadata into an object
const buildLinkPreview = (metaData: any, externalLink: string) => {
  return {
    title: getTag(
      metaData?.og?.title,
      metaData?.twitter?.title,
      metaData?.title,
      null, // Skip description in the title fallback
      externalLink // Use full URL with http(s) as the last fallback for title
    ),
    description: getTag(metaData?.og?.description, metaData?.twitter?.description, metaData?.description, null),
    image: getTag(
      metaData?.og?.image,
      metaData?.twitter?.image,
      metaData?.image,
      null
    ),
    site_name: getTag(metaData?.og?.site_name, metaData?.twitter?.site, metaData?.keywords, null)
  };
};

// Serve the function
serve(async (req) => {
  console.log("Received a request:", req.method, req.url);

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  if (req.method === 'OPTIONS') {
    console.log('Received OPTIONS request, returning ok');
    return new Response('ok', { headers: corsHeaders });
  }

  const writeLinkDataToDB = async (preview: any, url: string) => {
    console.log('Attempting to write link preview to DB for URL:', url);
    const record = {
      url,
      title: preview.title,
      description: preview.description, // If description is null, it will insert null
      image_location: preview.image,
      site_name: preview.site_name
    };

    const { data, error } = await supabaseClient
      .from('link_previews')
      .insert([record]);

    if (error) {
      console.error('Error writing data to DB:', error.message);
    } else {
      console.log('Data successfully written to DB:', data);
    }
  };

  try {
    console.log('Attempting to parse request body...');
    const { externalLink } = await req.json();
    console.log('External link received:', externalLink);

    // Fetch all meta tags
    console.log('Fetching metadata for the external link...');
    const metaData = await getMetaTags(externalLink);
    console.log("Raw MetaData Response:", JSON.stringify(metaData, null, 2));

    // Build the link preview based on the priority of tags
    const linkPreview = buildLinkPreview(metaData, externalLink);
    console.log("Link preview object built:", JSON.stringify(linkPreview));

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
