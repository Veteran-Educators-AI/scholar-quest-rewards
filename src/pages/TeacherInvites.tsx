import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Plus, Copy, Trash2, Link as LinkIcon, CheckCircle2, Clock, XCircle, ArrowLeft } from "lucide-react";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import { format } from "date-fns";
import highschoolLogo from "@/assets/highschool-logo-new.png";

interface InviteLink {
  id: string;
  token: string;
  student_name: string | null;
  student_email: string | null;
  class_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

interface TeacherClass {
  id: string;
  name: string;
}

export default function TeacherInvites() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const baseUrl = window.location.origin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch invites and classes in parallel
      const [invitesRes, classesRes] = await Promise.all([
        supabase
          .from("student_invite_links")
          .select("*")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("classes")
          .select("id, name")
          .eq("teacher_id", user.id)
      ]);

      if (invitesRes.data) setInvites(invitesRes.data);
      if (classesRes.data) setClasses(classesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    for (const byte of array) {
      token += chars[byte % chars.length];
    }
    return token;
  };

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data, error } = await supabase
        .from("student_invite_links")
        .insert({
          token,
          teacher_id: user.id,
          student_name: studentName || null,
          student_email: studentEmail || null,
          class_id: selectedClass || null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setInvites([data, ...invites]);
      setDialogOpen(false);
      setStudentName("");
      setStudentEmail("");
      setSelectedClass("");

      // Auto-copy the new invite URL
      const inviteUrl = `${baseUrl}/invite/${data.token}`;
      await navigator.clipboard.writeText(inviteUrl);

      toast({
        title: "Invite Created! 🎉",
        description: "The invite link has been copied to your clipboard.",
      });
    } catch (err: any) {
      console.error("Error creating invite:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create invite",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const inviteUrl = `${baseUrl}/invite/${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard.",
    });
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from("student_invite_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setInvites(invites.filter(inv => inv.id !== id));
      toast({
        title: "Invite Revoked",
        description: "The invite link has been deleted.",
      });
    } catch (err: any) {
      console.error("Error revoking invite:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to revoke invite",
        variant: "destructive",
      });
    }
  };

  const getInviteStatus = (invite: InviteLink) => {
    if (invite.used_at) {
      return { label: "Used", variant: "default" as const, icon: CheckCircle2 };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { label: "Expired", variant: "secondary" as const, icon: XCircle };
    }
    return { label: "Active", variant: "outline" as const, icon: Clock };
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return "—";
    const cls = classes.find(c => c.id === classId);
    return cls?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/teacher" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <img src={highschoolLogo} alt="ScholarQuest" className="h-8" />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Student Invite</DialogTitle>
                <DialogDescription>
                  Generate a unique invite link for a student to join ScholarQuest.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name (optional)</Label>
                  <Input
                    id="studentName"
                    placeholder="e.g. John Doe"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Student Email (optional)</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    placeholder="e.g. john@school.edu"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Enroll in Class (optional)</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No class</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvite} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create & Copy Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Student Invite Links
            </CardTitle>
            <CardDescription>
              Generate and manage invite links for students to join ScholarQuest directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">No Invite Links Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create invite links to onboard students without needing their email first.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Invite
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const status = getInviteStatus(invite);
                      const StatusIcon = status.icon;
                      const isActive = status.label === "Active";
                      
                      return (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {invite.student_name || "Unnamed"}
                              </div>
                              {invite.student_email && (
                                <div className="text-sm text-muted-foreground">
                                  {invite.student_email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getClassName(invite.class_id)}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(invite.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(invite.expires_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isActive && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyLink(invite.token)}
                                  title="Copy invite link"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    title="Revoke invite"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke Invite?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this invite link. 
                                      {invite.student_name && ` ${invite.student_name} will no longer be able to use it.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRevokeInvite(invite.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Revoke
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <PoweredByFooter />
    </div>
  );
}
