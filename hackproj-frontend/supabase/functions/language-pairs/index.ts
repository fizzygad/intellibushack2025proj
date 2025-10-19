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
      const { data: pairs, error } = await supabase
        .from("language_pairs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ pairs }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "POST") {
      const { sourceLang, targetLang, isFavorite = false } = await req.json();

      if (!sourceLang || !targetLang) {
        throw new Error("Source and target languages are required");
      }

      const { data: pair, error } = await supabase
        .from("language_pairs")
        .insert({
          user_id: user.id,
          source_language: sourceLang,
          target_language: targetLang,
          is_favorite: isFavorite,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ pair }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "PUT" && path.includes("/")) {
      const pairId = path.split("/").pop();

      if (!pairId) {
        throw new Error("Pair ID is required");
      }

      const { isFavorite } = await req.json();

      const { data: pair, error } = await supabase
        .from("language_pairs")
        .update({ is_favorite: isFavorite })
        .eq("id", pairId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ pair }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "DELETE" && path.includes("/")) {
      const pairId = path.split("/").pop();

      if (!pairId) {
        throw new Error("Pair ID is required");
      }

      const { error } = await supabase
        .from("language_pairs")
        .delete()
        .eq("id", pairId)
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
    console.error("Language pairs error:", error);
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
