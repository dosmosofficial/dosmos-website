import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Supabase function environment belum lengkap." }, 500);
    }

    const authorization = req.headers.get("Authorization") || "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) return json({ error: "Sesi tidak valid." }, 401);

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerProfile } = await service
      .from("admin_profiles")
      .select("id,role,status")
      .eq("id", callerData.user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "super_admin" || callerProfile.status !== "active") {
      return json({ error: "Hanya Super Admin aktif yang dapat mengelola user." }, 403);
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "list") {
      const { data: authData, error: authError } = await service.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authError) throw authError;

      const { data: profiles, error: profilesError } = await service
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (profilesError) throw profilesError;

      const authMap = new Map(authData.users.map((u) => [u.id, u]));
      const users = (profiles || []).map((profile) => ({
        ...profile,
        email: profile.email || authMap.get(profile.id)?.email || "",
        last_sign_in_at: authMap.get(profile.id)?.last_sign_in_at || null,
      }));
      return json({ users });
    }

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const fullName = String(body.full_name || "").trim();
      const role = String(body.role || "admin");
      const validRoles = ["super_admin","admin","content_admin","tournament_admin","moderator"];
      if (!email || !fullName) return json({ error: "Nama dan email wajib diisi." }, 400);
      if (password.length < 8) return json({ error: "Password minimal 8 karakter." }, 400);
      if (!validRoles.includes(role)) return json({ error: "Role tidak valid." }, 400);

      const { data, error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });
      if (error) throw error;

      const { error: profileError } = await service.from("admin_profiles").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        status: "active",
        is_protected: false,
        updated_at: new Date().toISOString(),
      });
      if (profileError) throw profileError;
      return json({ user_id: data.user.id }, 201);
    }

    const targetId = String(body.user_id || "");
    if (!targetId) return json({ error: "User ID wajib diisi." }, 400);

    const { data: target } = await service
      .from("admin_profiles")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();
    if (!target) return json({ error: "User tidak ditemukan." }, 404);

    if (action === "update") {
      const fullName = String(body.full_name || target.full_name).trim();
      const role = String(body.role || target.role);
      const status = String(body.status || target.status);
      const validRoles = ["super_admin","admin","content_admin","tournament_admin","moderator"];
      const validStatuses = ["active","suspended"];
      if (!validRoles.includes(role) || !validStatuses.includes(status)) {
        return json({ error: "Role atau status tidak valid." }, 400);
      }
      if (target.is_protected && (role !== target.role || status !== target.status)) {
        return json({ error: "Akun protected tidak dapat diturunkan role atau dinonaktifkan." }, 403);
      }

      const { error } = await service.from("admin_profiles").update({
        full_name: fullName,
        role,
        status,
        updated_at: new Date().toISOString(),
      }).eq("id", targetId);
      if (error) throw error;

      await service.auth.admin.updateUserById(targetId, {
        user_metadata: { full_name: fullName, role },
        ban_duration: status === "suspended" ? "876000h" : "none",
      });
      return json({ success: true });
    }

    if (action === "reset_password") {
      const password = String(body.password || "");
      if (password.length < 8) return json({ error: "Password minimal 8 karakter." }, 400);
      const { error } = await service.auth.admin.updateUserById(targetId, { password });
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete") {
      if (target.is_protected) return json({ error: "Akun protected tidak dapat dihapus." }, 403);
      if (targetId === callerData.user.id) return json({ error: "Anda tidak dapat menghapus akun sendiri." }, 403);
      const { error } = await service.auth.admin.deleteUser(targetId);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Action tidak dikenal." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Terjadi kesalahan." }, 500);
  }
});
