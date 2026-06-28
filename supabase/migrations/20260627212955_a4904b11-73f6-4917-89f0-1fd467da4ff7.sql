REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_profile_role_change() TO service_role;