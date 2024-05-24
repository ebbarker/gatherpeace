// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve }  from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from  "./cors.js";
import { getOGTags, getTwitterTags, getMetaTags } from "https://deno.land/x/opengraph/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';





serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  // This is needed if you're planning to invoke your function from a browser.
  // if (req.method === 'OPTIONS') {
  //   return new Response('ok', { headers: corsHeaders })
  // }

  // try {
  //   const { name } = await req.json()
  //   const data = {
  //     message: `Hello ${name}!`,
  //   }

  //   return new Response(JSON.stringify(data), {
  //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //     status: 200,
  //   })
  // } catch (error) {
  //   return new Response(JSON.stringify({ error: error.message }), {
  //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //     status: 400,
  //   })
  // }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const fetchLinkData = async (url: any) => {
    const { data, error } = await supabaseClient
        .from('link_previews')
        .select('*')
        .eq('url', url)
        .single();

    if (error) {
        console.error('Error fetching data:', error);
        return null;
    }
    console.log(JSON.stringify(data));

    return data;
  };

  const writeLinkDataToDB = async (linkData: any, url: string) => {
    // Construct the record to be inserted
    const record = {
      url,
      title: linkData.title,
      description: linkData.description,
      image_location: linkData.twitter.image ? linkData.twitter.image : linkData.og.image
    };

    // Insert the record into the database
    const { data, error } = await supabaseClient
        .from('link_previews')
        .insert([record]);

    if (error) {
        console.error('Error writing data:', error);
    } else {
        console.log('Data written to DB:', data);
    }
  };

  try {
    const { externalLink } = await req.json();
   let linkData = await fetchLinkData(externalLink);

    if (!linkData) {
     linkData = await getMetaTags(externalLink);
      console.log(JSON.stringify(linkData));
     writeLinkDataToDB(linkData, externalLink);
    }

    return new Response(JSON.stringify(linkData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/browser-with-cors' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
