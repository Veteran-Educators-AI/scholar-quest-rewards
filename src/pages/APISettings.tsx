import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface APIToken {
  id: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function APISettings() {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenScopes, setNewTokenScopes] = useState<string[]>(["read"]);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from("api_tokens")
        .select("id, name, scopes, is_active, last_used_at, expires_at, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!newTokenName.trim()) {
      toast.error("Please enter a name for the token");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create API tokens");
        return;
      }

      // Generate a secure random token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Hash the token for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Store the hashed token
      const { error } = await supabase.from("api_tokens").insert({
        name: newTokenName,
        token_hash: tokenHash,
        scopes: newTokenScopes,
        created_by: user.id,
      });

      if (error) throw error;

      setGeneratedToken(token);
      toast.success("API token created successfully");
      fetchTokens();
    } catch (error: any) {
      console.error("Error creating token:", error);
      toast.error("Failed to create token: " + error.message);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from("api_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) throw error;
      
      toast.success("API token deleted");
      fetchTokens();
    } catch (error: any) {
      toast.error("Failed to delete token: " + error.message);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const toggleScope = (scope: string) => {
    setNewTokenScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-api`;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/teacher">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-foreground text-xl">API Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage API tokens for external integrations
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* API Documentation */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            API Endpoint
          </h2>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm break-all">
            {baseUrl}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Use this endpoint with your API key in the <code className="bg-muted px-1 rounded">x-api-key</code> header.
          </p>

          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-foreground">Available Endpoints:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li><code className="bg-muted px-1 rounded">GET /students</code> - List students (filter by class_id)</li>
              <li><code className="bg-muted px-1 rounded">GET /standards</code> - List NYS standards (filter by grade_band, subject)</li>
              <li><code className="bg-muted px-1 rounded">GET /mastery</code> - Get student mastery data</li>
              <li><code className="bg-muted px-1 rounded">GET /assignments</code> - List assignments</li>
              <li><code className="bg-muted px-1 rounded">GET /classes</code> - List your classes</li>
              <li><code className="bg-muted px-1 rounded">POST /assignments</code> - Create an assignment</li>
            </ul>
          </div>
        </motion.section>

        {/* Create Token */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-foreground">API Tokens</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setNewTokenName("");
                  setNewTokenScopes(["read"]);
                  setGeneratedToken(null);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {generatedToken ? "Token Created" : "Create API Token"}
                  </DialogTitle>
                  <DialogDescription>
                    {generatedToken
                      ? "Copy this token now. It won't be shown again!"
                      : "Create a new API token for external integrations."}
                  </DialogDescription>
                </DialogHeader>

                {generatedToken ? (
                  <div className="space-y-4">
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                      <p className="text-sm text-warning">
                        This token will only be shown once. Copy it now!
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={generatedToken}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(generatedToken)}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="token-name">Token Name</Label>
                      <Input
                        id="token-name"
                        placeholder="e.g., Scan Genius Integration"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {["read", "write", "admin"].map((scope) => (
                          <div key={scope} className="flex items-center gap-2">
                            <Checkbox
                              id={`scope-${scope}`}
                              checked={newTokenScopes.includes(scope)}
                              onCheckedChange={() => toggleScope(scope)}
                            />
                            <Label htmlFor={`scope-${scope}`} className="capitalize">
                              {scope}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {generatedToken ? (
                    <Button onClick={() => setDialogOpen(false)}>Done</Button>
                  ) : (
                    <Button onClick={generateToken}>Generate Token</Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Token List */}
          <div className="space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl" />
                ))}
              </div>
            ) : tokens.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No API tokens created yet</p>
              </div>
            ) : (
              tokens.map((token) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{token.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {token.scopes.map((scope) => (
                            <Badge key={scope} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                          {!token.is_active && (
                            <Badge variant="destructive" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {token.last_used_at
                          ? `Last used: ${new Date(token.last_used_at).toLocaleDateString()}`
                          : "Never used"}
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Token</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the token "{token.name}".
                              Any integrations using this token will stop working.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteToken(token.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>

        {/* Example Code */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="font-bold text-lg text-foreground mb-4">Example Usage</h2>
          <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
{`// Fetch students from your class
fetch('${baseUrl}/students?class_id=YOUR_CLASS_ID', {
  headers: {
    'x-api-key': 'YOUR_API_TOKEN'
  }
})
.then(res => res.json())
.then(data => console.log(data));

// Create an assignment
fetch('${baseUrl}/assignments', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Algebra Quiz',
    class_id: 'YOUR_CLASS_ID',
    due_at: '2026-01-15T23:59:59Z',
    xp_reward: 100,
    standard_id: 'STANDARD_UUID'
  })
});`}
          </pre>
        </motion.section>
      </main>
    </div>
  );
}
