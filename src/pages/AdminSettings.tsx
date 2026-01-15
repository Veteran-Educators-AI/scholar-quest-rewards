import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, RefreshCw, Settings, Shield } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiToken {
  id: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [tokenName, setTokenName] = useState("");
  const [scopeRead, setScopeRead] = useState(true);
  const [scopeWrite, setScopeWrite] = useState(true);
  const [scopeAdmin, setScopeAdmin] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from("api_tokens")
        .select("id, name, scopes, is_active, created_at, last_used_at, expires_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!tokenName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this API key",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Use getSession for more reliable auth check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to generate API keys. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      const user = session.user;

      // Generate a secure random token
      const rawToken = `sq_live_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;

      // Hash the token
      const encoder = new TextEncoder();
      const data = encoder.encode(rawToken);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Build scopes array
      const scopes: string[] = [];
      if (scopeRead) scopes.push("read");
      if (scopeWrite) scopes.push("write");
      if (scopeAdmin) scopes.push("admin");

      // Calculate expiry
      let expiresAt = null;
      if (expiresInDays) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiresInDays);
        expiresAt = expiry.toISOString();
      }

      // Insert into database
      const { error } = await supabase
        .from("api_tokens")
        .insert({
          name: tokenName.trim(),
          token_hash: tokenHash,
          scopes,
          is_active: true,
          created_by: user.id,
          expires_at: expiresAt,
        });

      if (error) throw error;

      // Show the new key
      setNewApiKey(rawToken);
      setShowCreateDialog(false);
      setShowNewKeyDialog(true);
      
      // Reset form
      setTokenName("");
      setScopeRead(true);
      setScopeWrite(true);
      setScopeAdmin(false);
      setExpiresInDays(null);
      
      // Refresh list
      fetchTokens();

      toast({
        title: "API Key created!",
        description: "Make sure to copy it now - you won't see it again.",
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteToken = async () => {
    if (!tokenToDelete) return;
    
    try {
      const { error } = await supabase
        .from("api_tokens")
        .delete()
        .eq("id", tokenToDelete);

      if (error) throw error;

      toast({
        title: "API Key deleted",
        description: "The API key has been revoked.",
      });
      
      fetchTokens();
    } catch (error) {
      console.error("Error deleting token:", error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setTokenToDelete(null);
    }
  };

  const toggleTokenStatus = async (tokenId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("api_tokens")
        .update({ is_active: !currentStatus })
        .eq("id", tokenId);

      if (error) throw error;

      toast({
        title: currentStatus ? "API Key disabled" : "API Key enabled",
      });
      
      fetchTokens();
    } catch (error) {
      console.error("Error toggling token:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout
      title="Settings"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
    >
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-2xl">Admin Settings</h1>
            <p className="text-sm text-muted-foreground">Manage API keys & integrations</p>
          </div>
        </div>

        {/* API Keys Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for external integrations
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Generate Key
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No API keys yet</p>
                <p className="text-sm">Generate your first key to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{token.name}</span>
                        {!token.is_active && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                        {token.expires_at && new Date(token.expires_at) < new Date() && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>Created {formatDate(token.created_at)}</span>
                        {token.last_used_at && (
                          <span>• Last used {formatDate(token.last_used_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {token.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTokenStatus(token.id, token.is_active)}
                      >
                        {token.is_active ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTokenToDelete(token.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* API Endpoint Info */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                API Endpoint
              </h4>
              <code className="text-sm bg-background px-2 py-1 rounded border block overflow-x-auto">
                https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/external-api
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                Use the <code className="text-primary">x-api-key</code> header to authenticate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external integrations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                placeholder="e.g., NYCologic Integration"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="read"
                    checked={scopeRead}
                    onCheckedChange={(checked) => setScopeRead(!!checked)}
                  />
                  <Label htmlFor="read" className="font-normal">
                    Read - Access student data, assignments, standards
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="write"
                    checked={scopeWrite}
                    onCheckedChange={(checked) => setScopeWrite(!!checked)}
                  />
                  <Label htmlFor="write" className="font-normal">
                    Write - Create assignments, sync data
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="admin"
                    checked={scopeAdmin}
                    onCheckedChange={(checked) => setScopeAdmin(!!checked)}
                  />
                  <Label htmlFor="admin" className="font-normal">
                    Admin - Full access (use with caution)
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expiration (optional)</Label>
              <div className="flex gap-2">
                <Button
                  variant={expiresInDays === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiresInDays(null)}
                >
                  Never
                </Button>
                <Button
                  variant={expiresInDays === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiresInDays(30)}
                >
                  30 days
                </Button>
                <Button
                  variant={expiresInDays === 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiresInDays(90)}
                >
                  90 days
                </Button>
                <Button
                  variant={expiresInDays === 365 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiresInDays(365)}
                >
                  1 year
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={generateApiKey} disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Display Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔑 Your New API Key</DialogTitle>
            <DialogDescription>
              Copy this key now. For security, it won't be shown again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Input
                readOnly
                value={newApiKey}
                className="pr-10 font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => copyToClipboard(newApiKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Store this key securely. You won't be able to see it again!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              copyToClipboard(newApiKey);
              setShowNewKeyDialog(false);
              setNewApiKey("");
            }}>
              Copy & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for any integrations using this key.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteToken} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
