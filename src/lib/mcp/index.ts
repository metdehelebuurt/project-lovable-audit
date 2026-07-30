import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listLeadsTool from "./tools/list-leads";
import getLeadTool from "./tools/get-lead";
import listOffertesTool from "./tools/list-offertes";
import listInstallatiesTool from "./tools/list-installaties";
import createLeadNotitieTool from "./tools/create-lead-notitie";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mijnhuis-nu-backend",
  title: "Mijnhuis.nu (backend)",
  version: "0.1.0",
  instructions:
    "Tools voor Mijnhuis.nu. Gebruik `whoami` voor het eigen profiel, `list_leads` en `get_lead` voor leads, " +
    "`list_offertes` voor offertes, `list_installaties` voor de installatieplanning en `create_lead_notitie` " +
    "om een notitie bij een lead te plaatsen. Alle data is beperkt tot wat de ingelogde gebruiker mag zien.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoamiTool,
    listLeadsTool,
    getLeadTool,
    listOffertesTool,
    listInstallatiesTool,
    createLeadNotitieTool,
  ],
});