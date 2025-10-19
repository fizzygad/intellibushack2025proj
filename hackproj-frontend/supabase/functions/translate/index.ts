import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  roomId?: string;
  saveToHistory?: boolean;
}

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
    const googleApiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");

    if (!googleApiKey) {
      throw new Error("GOOGLE_TRANSLATE_API_KEY not configured");
    }

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

    const { text, sourceLang, targetLang, roomId, saveToHistory = true }: TranslateRequest = await req.json();

    if (!text || !sourceLang || !targetLang) {
      throw new Error("Missing required fields: text, sourceLang, targetLang");
    }

    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
    const translateResponse = await fetch(translateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
    });

    if (!translateResponse.ok) {
      const error = await translateResponse.text();
      throw new Error(`Translation API error: ${error}`);
    }

    const translateData = await translateResponse.json();
    const translatedText = translateData.data.translations[0].translatedText;

    if (saveToHistory) {
      await supabase.from("translation_history").insert({
        user_id: user.id,
        original_text: text,
        translated_text: translatedText,
        source_language: sourceLang,
        target_language: targetLang,
      });
    }

    if (roomId) {
      await supabase.from("room_translations").insert({
        room_id: roomId,
        from_user: user.id,
        original_text: text,
        translated_text: translatedText,
        source_lang: sourceLang,
        target_lang: targetLang,
      });
    }

    return new Response(
      JSON.stringify({
        original: text,
        translated: translatedText,
        sourceLang,
        targetLang,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Translation failed",
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
