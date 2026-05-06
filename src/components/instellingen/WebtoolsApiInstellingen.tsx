import { Link } from "react-router-dom";

import { ApiTokensManager } from "@/components/webtools/ApiTokensManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";

export default function WebtoolsApiInstellingen() {
  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-api`;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Webtools & API</CardTitle>
          <CardDescription>
            Beheer hier uw REST API-tokens. Voor widgets en embeds gaat u naar het Webtools-overzicht.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">API base URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background border px-2 py-1.5 text-xs break-all">
                {apiBaseUrl}
              </code>
              <CopyButton value={apiBaseUrl} />
            </div>
            <p className="text-xs text-muted-foreground">
              Gebruik deze URL als basis voor alle endpoints, bijvoorbeeld
              <code className="mx-1 rounded bg-muted px-1 py-0.5">{apiBaseUrl}/products</code>
              of
              <code className="mx-1 rounded bg-muted px-1 py-0.5">{apiBaseUrl}/leads</code>.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              Gebruik REST API-tokens voor externe koppelingen en test direct of uw token toegang heeft tot
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">/products</code>
              en
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">/leads</code>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/tools">Webtools openen</Link>
            </Button>
          </div>

          <ApiTokensManager />
        </CardContent>
      </Card>
    </div>
  );
}