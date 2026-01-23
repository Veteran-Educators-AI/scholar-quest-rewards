import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, CheckCircle, ExternalLink, RefreshCw, Webhook, Send, ArrowDownToLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WebhookLog {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  payload: Record<string, unknown> | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/geoblox-webhook`;
const SYNC_URL = `${SUPABASE_URL}/functions/v1/geoblox-sync`;

const apiActions = [
  {
    action: "create_practice_set",
    description: "Create a personalized practice set with questions",
    example: {
      action: "create_practice_set",
      data: {
        student_id: "uuid",
        title: "Fractions Practice",
        description: "Practice adding and subtracting fractions",
        skill_tags: ["fractions", "addition"],
        xp_reward: 25,
        coin_reward: 10,
        questions: [
          {
            prompt: "What is 1/2 + 1/4?",
            question_type: "multiple_choice",
            options: ["3/4", "2/6", "1/6", "2/4"],
            answer_key: { correct: "3/4" },
            hint: "Find a common denominator",
            difficulty: 2,
            skill_tag: "fractions"
          }
        ]
      }
    }
  },
  {
    action: "create_skill_game",
    description: "Create a skill-based game for a student",
    example: {
      action: "create_skill_game",
      data: {
        student_id: "uuid",
        title: "Fraction Match",
        game_type: "matching",
        skill_tag: "fractions",
        difficulty: 2,
        xp_reward: 30,
        coin_reward: 15,
        game_data: {
          pairs: [
            { term: "1/2", match: "0.5" },
            { term: "1/4", match: "0.25" }
          ]
        }
      }
    }
  },
  {
    action: "update_student_weaknesses",
    description: "Update a student's weakness data and recommendations",
    example: {
      action: "update_student_weaknesses",
      data: {
        student_id: "uuid",
        weak_topics: ["fractions", "decimals", "percentages"],
        misconceptions: [
          { topic: "fractions", issue: "Confuses numerator and denominator" }
        ],
        remediation_recommendations: [
          "Practice visual fraction models",
          "Use number lines for fraction comparison"
        ]
      }
    }
  },
  {
    action: "notify_student",
    description: "Send a notification to a student",
    example: {
      action: "notify_student",
      data: {
        student_id: "uuid",
        content_type: "practice_set",
        content_id: "uuid",
        message: "New personalized practice set is ready for you!"
      }
    }
  },
  {
    action: "sync_mastery_update",
    description: "Update a student's mastery level for a standard",
    example: {
      action: "sync_mastery_update",
      data: {
        student_id: "uuid",
        standard_code: "6.NS.1",
        mastery_level: "approaching",
        attempts_count: 5,
        correct_count: 3
      }
    }
  }
];

const outboundActions = [
  {
    action: "sync_student",
    description: "Push student data to GeoBlox",
    endpoint: "?action=sync_student&student_id=uuid"
  },
  {
    action: "sync_all",
    description: "Push all students to GeoBlox",
    endpoint: "?action=sync_all"
  },
  {
    action: "get_progress",
    description: "Get student progress from GeoBlox",
    endpoint: "?action=get_progress&student_id=uuid"
  },
  {
    action: "assign_content",
    description: "Assign content through GeoBlox",
    endpoint: "?action=assign_content"
  }
];

export default function AdminGeoBloxIntegration() {
  const [copied, setCopied] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("webhook_event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data as WebhookLog[]);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const testWebhook = async () => {
    toast({ title: "Testing webhook...", description: "Sending test request" });
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", data: {} })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({ title: "Webhook reachable", description: "Connection successful (auth required for actions)" });
      } else {
        toast({ 
          title: "Response received", 
          description: result.error || "Webhook responded",
          variant: response.status === 401 ? "default" : "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reach webhook", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">GeoBlox Integration</h1>
          <p className="text-muted-foreground">
            API documentation and sync logs for GeoBlox integration
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-green-500" />
                Inbound Webhook (GeoBlox → Scholar Quest)
              </CardTitle>
              <CardDescription>GeoBlox sends content to this endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                  {WEBHOOK_URL}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(WEBHOOK_URL, "Webhook URL")}
                >
                  {copied === "Webhook URL" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline">POST</Badge>
                <Badge variant="secondary">x-api-key header required</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                Outbound Sync (Scholar Quest → GeoBlox)
              </CardTitle>
              <CardDescription>Push student data to GeoBlox</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                  {SYNC_URL}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(SYNC_URL, "Sync URL")}
                >
                  {copied === "Sync URL" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline">GET/POST</Badge>
                <Badge variant="secondary">Auth required</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inbound" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbound">Inbound API</TabsTrigger>
            <TabsTrigger value="outbound">Outbound API</TabsTrigger>
            <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="inbound" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inbound Actions (GeoBlox → Scholar Quest)</CardTitle>
                <CardDescription>
                  GeoBlox can call the webhook with these actions to send customized content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {apiActions.map((api) => (
                  <div key={api.action} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{api.action}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(JSON.stringify(api.example, null, 2), api.action)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{api.description}</p>
                    <ScrollArea className="h-48">
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(api.example, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outbound" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Outbound Actions (Scholar Quest → GeoBlox)</CardTitle>
                <CardDescription>
                  Use these endpoints to push data from Scholar Quest to GeoBlox
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Endpoint</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outboundActions.map((action) => (
                      <TableRow key={action.action}>
                        <TableCell className="font-mono text-sm">{action.action}</TableCell>
                        <TableCell>{action.description}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {action.endpoint}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Webhook Event Logs</CardTitle>
                    <CardDescription>Recent webhook events and sync operations</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={testWebhook}>
                      <Webhook className="w-4 h-4 mr-1" />
                      Test Webhook
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchLogs}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No webhook events recorded yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.event_type}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {log.error_message || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
