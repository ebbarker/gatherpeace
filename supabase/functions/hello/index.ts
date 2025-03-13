import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

// ------------------- Helper Functions -------------------

/** Check if a string is a valid URL. */
function isUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches and parses the HTML into a DOM document.
 * If `htmlOrUrl` is a URL, it fetches first; otherwise treats it as raw HTML.
 */
async function loadDocument(htmlOrUrl: string) {
  let html = htmlOrUrl;

  if (isUrl(htmlOrUrl)) {
    const response = await fetch(htmlOrUrl);
    html = await response.text();
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) {
    throw new Error("Unable to parse HTML.");
  }
  return doc;
}

/**
 * Extracts Open Graph (og:...) and Twitter (twitter:...) tags into a single object:
 * {
 *   og: { title: "...", image: "...", ... },
 *   twitter: { card: "...", image: "...", ... },
 *   title: "...", // from <title> if no og:title
 * }
 */
export async function getMetaTags(htmlOrUrl: string): Promise<{
  og: Record<string, string>;
  twitter: Record<string, string>;
  title?: string;
}> {
  const doc = await loadDocument(htmlOrUrl);
  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};

  const metaElements = (await doc).querySelectorAll("meta");
  metaElements.forEach((meta) => {
    const property = meta.getAttribute("property") || meta.getAttribute("name");
    const content = meta.getAttribute("content") || "";

    // Open Graph tags
    if (property && property.toLowerCase().startsWith("og:")) {
      // e.g. "og:image" => key="image"
      const key = property.slice(3);
      og[key] = content;
    }

    // Twitter tags
    if (property && property.toLowerCase().startsWith("twitter:")) {
      // e.g. "twitter:image" => key="image"
      const key = property.slice(8);
      twitter[key] = content;
    }
  });

  // If there's a <title> and no og:title, fall back to doc.title
  if (!og.title && doc.title) {
    og.title = doc.title;
  }

  return { og, twitter, title: doc.title || undefined };
}

/** Utility to pick the first non-empty string. */
function getTag(...tags: any[]): string | undefined {
  return tags.find(
    (tag) => tag && typeof tag === "string" && tag.trim() !== ""
  );
}

/** Build a final preview object from the extracted meta tags. */
function buildLinkPreview(metaData: any, externalLink: string) {
  return {
    title: getTag(
      metaData?.og?.title,
      metaData?.twitter?.title,
      metaData?.title,
      externalLink
    ),
    description: getTag(
      metaData?.og?.description,
      metaData?.twitter?.description,
      null
    ),
    image: getTag(
      metaData?.twitter?.image,
      metaData?.og?.image,
      null
    ),
    site_name: getTag(
      metaData?.og?.site_name,
      metaData?.twitter?.site,
      null
    ),
  };
}

// ------------------- Main Function -------------------

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  /** Write the preview record to the DB. */
  const writeLinkDataToDB = async (preview: any, url: string) => {
    const record = {
      url,
      title: preview.title,
      description: preview.description,
      image_location: preview.image,
    };
    console.log("Writing data to DB:", JSON.stringify(record));

    const { data, error } = await supabaseClient
      .from("link_previews")
      .insert([record]);

    console.log("Insert Result:", { data, error });

    if (error) {
      console.error("Error writing data to DB:", error.message);
    } else {
      console.log("data inserted successfully");
    }
  };

  try {
    // Parse JSON body
    const { externalLink } = await req.json();
    console.log("Received externalLink:", externalLink);

    // Fetch meta tags
    const metaData = await getMetaTags(externalLink);
    console.log("Fetched metaData:", JSON.stringify(metaData));

    // Build final preview object
    const linkPreview = buildLinkPreview(metaData, externalLink);

    // Attempt DB insert
    let insertError: string | null = null;
    try {
      await writeLinkDataToDB(linkPreview, externalLink);
    } catch (err) {
      if (err instanceof Error) {
        insertError = err.message;
        console.error("Write to DB failed:", err);
      } else {
        insertError = "Unknown error";
        console.error("Write to DB failed:", err);
      }
    }

    // Always return the preview (plus any DB error) immediately
    return new Response(
      JSON.stringify({
        preview: linkPreview,
        writeError: insertError,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Catch any top-level error (like JSON parsing issues)
    const msg = error instanceof Error ? error.message : String(error);
    console.error("An error occurred:", msg);

    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
