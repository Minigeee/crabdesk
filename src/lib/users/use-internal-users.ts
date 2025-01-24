import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/database.types";
import { useOrganization } from "@/components/providers/organization-provider";
import assert from "assert";

export type InternalUser = Tables<"internal_users">;

export function useInternalUsers(search: string) {
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["internal_users", search],
    queryFn: async () => {
      assert(organization, "Organization is required");
      const supabase = createClient();
      const { data } = await supabase
        .from("internal_users")
        .select("*")
        .eq("org_id", organization.id)
        .ilike("name", `%${search}%`)
        .order("name")
        .limit(10);
      return (data as InternalUser[]) || [];
    },
    enabled: !!organization,
  });
} 