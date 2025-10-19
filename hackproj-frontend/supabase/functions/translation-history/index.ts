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
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const sourceLang = url.searchParams.get("sourceLang");
      const targetLang = url.searchParams.get("targetLang");

      let query = supabase
        .from("translation_history")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (sourceLang) {
        query = query.eq("source_language", sourceLang);
      }
      if (targetLang) {
        query = query.eq("target_language", targetLang);
      }

      const { data: history, error, count } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ history, count }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "DELETE" && path.includes("/")) {
      const historyId = path.split("/").pop();

      if (!historyId) {
        throw new Error("History ID is required");
      }

      const { error } = await supabase
        .from("translation_history")
        .delete()
        .eq("id", historyId)
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

    if (req.method === "DELETE" && path.endsWith("/clear")) {
      const { error } = await supabase
        .from("translation_history")
        .delete()
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
    console.error("Translation history error:", error);
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
