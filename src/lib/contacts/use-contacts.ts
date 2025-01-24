import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/database.types";
import { useOrganization } from "@/components/providers/organization-provider";
import assert from "assert";

export type Contact = Tables<"contacts">;

export function useContacts(search: string) {
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["contacts", search],
    queryFn: async () => {
      assert(organization, "Organization is required");
      const supabase = createClient();
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("org_id", organization.id)
        .ilike("email", `%${search}%`)
        .order("email")
        .limit(10);
      return (data as Contact[]) || [];
    },
    enabled: !!organization,
  });
} 