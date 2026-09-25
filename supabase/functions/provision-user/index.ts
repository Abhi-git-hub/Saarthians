import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeUsername = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Function misconfigured." }, 500);
  }

  // Authenticate the caller by asking the Auth server itself who this token
  // belongs to. This deliberately avoids local JWT verification, which
  // breaks across key rotations (e.g. strict `kid` enforcement rejecting
  // otherwise-valid tokens). The Auth API is authoritative for its own
  // tokens; RLS + the admin profile check below remain the authorization.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return json({ error: "Authentication required." }, 401);

  const supabase = createClient(supabaseUrl, anonKey);
  const { data: callerData, error: callerError } = await supabase.auth.getUser(token);
  const actorId = callerError ? null : callerData.user?.id ?? null;
  if (!actorId) return json({ error: "Authentication required." }, 401);

  // User-scoped client carrying the caller's token: RLS and auth.uid()
  // inside admin_provision_profile see the admin, exactly as before.
  const supabaseAsCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: actor, error: actorError } = await supabaseAsCaller
    .from("profiles")
    .select("role,status")
    .eq("id", actorId)
    .single();

  if (actorError || actor?.role !== "admin" || actor?.status !== "active") {
    return json({ error: "Administrator access required." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const username = normalizeUsername(body.username);
  const displayName = cleanText(body.displayName, 120);
  const password = typeof body.password === "string" ? body.password : "";
  const phone = cleanText(body.phone, 32) || null;
  const gradeLevel = cleanText(body.gradeLevel, 40) || null;
  const subject = cleanText(body.subject, 120) || null;
  const role = body.role === "teacher" ? "teacher" : body.role === "student" ? "student" : "";

  if (!/^[a-z0-9](?:[a-z0-9._-]{2,29})$/.test(username)) {
    return json({ error: "Username must be 3–30 characters using lowercase letters, numbers, dots, hyphens or underscores." }, 400);
  }
  if (!displayName || displayName.length < 2) return json({ error: "A full name is required." }, 400);
  if (!role) return json({ error: "Choose student or teacher." }, 400);
  if (password.length < 10 || password.length > 128) return json({ error: "Password must be between 10 and 128 characters." }, 400);

  const { data: existing } = await supabaseAsCaller
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existing) return json({ error: "That username is already in use." }, 409);

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const authEmail = `${username}@accounts.saarthians.online`;
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, username, managed_account: true },
  });

  if (createError || !created.user) return json({ error: "We couldn't create that account." }, 400);

  const { data: profile, error: profileError } = await supabaseAsCaller.rpc("admin_provision_profile", {
    p_user_id: created.user.id,
    p_display_name: displayName,
    p_username: username,
    p_role: role,
    p_phone: phone,
    p_grade_level: gradeLevel,
    p_subject: subject,
  });

  if (profileError || !profile) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Account creation was rolled back because its profile could not be provisioned." }, 500);
  }

  return json({ ok: true, user: { id: created.user.id, username, displayName, role, status: "active" } }, 201);
});
