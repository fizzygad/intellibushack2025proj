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

    if (req.method === "POST" && path.endsWith("/create")) {
      const { roomCode } = await req.json();
      
      if (!roomCode) {
        throw new Error("Room code is required");
      }

      const { data: room, error } = await supabase
        .from("rooms")
        .insert({
          room_code: roomCode,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ room }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "POST" && path.endsWith("/join")) {
      const { roomCode, preferredLang = "en" } = await req.json();
      
      if (!roomCode) {
        throw new Error("Room code is required");
      }

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode)
        .eq("is_active", true)
        .maybeSingle();

      if (roomError) throw roomError;
      if (!room) throw new Error("Room not found or inactive");

      const { error: participantError } = await supabase
        .from("room_participants")
        .upsert({
          room_id: room.id,
          user_id: user.id,
          preferred_lang: preferredLang,
        }, {
          onConflict: "room_id,user_id",
        });

      if (participantError) throw participantError;

      const { data: participants, error: participantsError } = await supabase
        .from("room_participants")
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            first_name,
            last_name
          )
        `)
        .eq("room_id", room.id);

      if (participantsError) throw participantsError;

      return new Response(
        JSON.stringify({ room, participants }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "GET" && path.includes("/participants/")) {
      const roomId = path.split("/participants/")[1];
      
      if (!roomId) {
        throw new Error("Room ID is required");
      }

      const { data: participants, error } = await supabase
        .from("room_participants")
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            first_name,
            last_name,
            preferred_language
          )
        `)
        .eq("room_id", roomId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ participants }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "POST" && path.endsWith("/leave")) {
      const { roomId } = await req.json();
      
      if (!roomId) {
        throw new Error("Room ID is required");
      }

      const { error } = await supabase
        .from("room_participants")
        .delete()
        .eq("room_id", roomId)
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

    if (req.method === "GET" && path.includes("/translations/")) {
      const roomId = path.split("/translations/")[1];
      
      if (!roomId) {
        throw new Error("Room ID is required");
      }

      const { data: translations, error } = await supabase
        .from("room_translations")
        .select(`
          *,
          profiles:from_user (
            id,
            username
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(
        JSON.stringify({ translations }),
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
    console.error("Room management error:", error);
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
