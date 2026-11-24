-- Permite que o papel anon avalie a política agencias_select_public
-- (private.is_admin() sempre retorna false quando auth.uid() é null;
-- private.admins continua bloqueada para public, anon e authenticated).
grant usage on schema private to anon;
grant execute on function private.is_admin() to anon;
