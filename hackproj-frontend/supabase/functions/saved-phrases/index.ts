import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "GET") {
      const sourceLang = url.searchParams.get("sourceLang");
      const targetLang = url.searchParams.get("targetLang");

      let query = supabase
        .from("saved_phrases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sourceLang) {
        query = query.eq("source_lang", sourceLang);
      }
      if (targetLang) {
        query = query.eq("target_lang", targetLang);
      }

      const { data: phrases, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ phrases }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "POST") {
      const { originalText, translatedText, sourceLang, targetLang } = await req.json();

      if (!originalText || !translatedText || !sourceLang || !targetLang) {
        throw new Error("Missing required fields");
      }

      const { data: phrase, error } = await supabase
        .from("saved_phrases")
        .insert({
          user_id: user.id,
          original_text: originalText,
          translated_text: translatedText,
          source_lang: sourceLang,
          target_lang: targetLang,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ phrase }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "DELETE" && path.includes("/")) {
      const phraseId = path.split("/").pop();

      if (!phraseId) {
        throw new Error("Phrase ID is required");
      }

      const { error } = await supabase
        .from("saved_phrases")
        .delete()
        .eq("id", phraseId)
        .eq("user_id", user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    throw new Error("Invalid endpoint");
  } catch (error) {
    console.error("Saved phrases error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Operation failed",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
