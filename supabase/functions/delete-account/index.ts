import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

async function removerPrefixo(
  adminClient: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
) {
  try {
    const { data } = await adminClient.storage.from(bucket).list(prefix, { limit: 1000 });
    const caminhos = (data ?? [])
      .filter((item) => item.id !== null)
      .map((item) => `${prefix}/${item.name}`);
    if (caminhos.length) {
      await adminClient.storage.from(bucket).remove(caminhos);
    }
  } catch {
    // best-effort: não bloqueia exclusão da conta
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ detail: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ detail: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Limpa arquivos no Storage (best-effort) antes de apagar agência e usuário
    const { data: agencias } = await adminClient
      .from("agencias")
      .select("id")
      .eq("usuario_id", user.id);

    await Promise.all([
      removerPrefixo(adminClient, "avatars", user.id),
      removerPrefixo(adminClient, "documentos-agencia", user.id),
      ...(agencias ?? []).flatMap((ag) => [
        removerPrefixo(adminClient, "agencias", String(ag.id)),
        removerPrefixo(adminClient, "agencias", `${ag.id}/galeria`),
      ]),
    ]);

    // Apaga primeiro a agência ligada à conta (cascade leva planos, galeria, avaliações dela)
    await adminClient.from("agencias").delete().eq("usuario_id", user.id);

    // Apaga o usuário do Auth (cascade leva profile, favoritos e avaliações dele)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ detail: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
