import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Key,
  Copy,
  Trash2,
  Plus,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import scanGeniusLogo from "@/assets/scan-genius-logo.png";

interface IntegrationToken {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export default function TeacherIntegrations() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<IntegrationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [showNewToken, setShowNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/scan-genius-webhook`;

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("id, name, created_at, last_used_at, is_active")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTokens(data);
    }
    setLoading(false);
  };

  const generateToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const hashToken = async (token: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const createToken = async () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      return;
    }

    const plainToken = generateToken();
    const tokenHash = await hashToken(plainToken);

    const { error } = await supabase
      .from("integration_tokens")
      .insert({
        name: newTokenName.trim(),
        token_hash: tokenHash,
        created_by: user.id,
        is_active: true,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    } else {
      setShowNewToken(plainToken);
      setNewTokenName("");
      fetchTokens();
      toast({
        title: "API Key Created",
        description: "Copy your key now - it won't be shown again!",
      });
    }
    setCreating(false);
  };

  const deleteToken = async (id: string) => {
    const { error } = await supabase
      .from("integration_tokens")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key.",
        variant: "destructive",
      });
    } else {
      setTokens(tokens.filter(t => t.id !== id));
      toast({
        title: "Deleted",
        description: "API key has been revoked.",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Copied to clipboard.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/teacher">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <img 
                src={scanGeniusLogo} 
                alt="Scan Genius" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="font-bold text-foreground text-xl">Scan Genius Integration</h1>
                <p className="text-sm text-muted-foreground">Manage API keys & webhook</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-3xl">
        {/* Webhook URL */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold text-foreground text-lg mb-2">Webhook URL</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configure Scan Genius to send data to this endpoint.
            </p>
            
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <code className="flex-1 text-sm text-foreground font-mono break-all">
                {webhookUrl}
              </code>
              <Button 
                variant="ghost" 
                size="icon-sm"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.section>

        {/* New Token Alert */}
        {showNewToken && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-warning/10 border-2 border-warning rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Save your API Key!</h3>
                  <p className="text-sm text-muted-foreground">
                    This key will only be shown once. Copy it now and store it securely.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-card rounded-xl p-3 border border-border">
                <code className="flex-1 text-sm text-foreground font-mono break-all">
                  {showNewToken}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon-sm"
                  onClick={() => copyToClipboard(showNewToken)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowNewToken(null)}
              >
                I've saved my key
              </Button>
            </div>
          </motion.section>
        )}

        {/* Create New Token */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold text-foreground text-lg mb-2">Create API Key</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a new API key for Scan Genius to authenticate with Scan Scholar.
            </p>
            
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Key name (e.g., Production, Testing)"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button 
                onClick={createToken} 
                disabled={creating}
              >
                <Plus className="w-4 h-4 mr-1" />
                {creating ? "Creating..." : "Create Key"}
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Existing Tokens */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-foreground text-lg mb-4">Your API Keys</h2>
          
          {loading ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No API keys yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token, index) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      token.is_active ? "bg-success/10" : "bg-muted"
                    }`}>
                      <Key className={`w-5 h-5 ${token.is_active ? "text-success" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(token.created_at)}
                        {token.last_used_at && ` • Last used ${formatDate(token.last_used_at)}`}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => deleteToken(token.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Documentation */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-muted/50 rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-3">API Documentation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Send requests to the webhook URL with your API key in the <code className="bg-muted px-1 rounded">x-api-key</code> header.
            </p>
            
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Example: Push Assignment</p>
              <pre className="text-xs text-foreground overflow-x-auto">
{`POST ${webhookUrl}
Headers:
  x-api-key: your-api-key
  Content-Type: application/json

Body:
{
  "type": "assignment",
  "data": {
    "external_ref": "sg-12345",
    "class_code": "MATH101",
    "title": "Fractions Practice",
    "subject": "Math",
    "due_at": "2026-01-15T23:59:00Z",
    "xp_reward": 50,
    "coin_reward": 10
  }
}`}
              </pre>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
