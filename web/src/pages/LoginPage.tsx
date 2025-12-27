import React, { useMemo, useState } from "react";
import { Shield, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types";

export function LoginPage() {
  const { users, login, isLoading } = useAuth();

  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const roleColors: Record<string, string> = {
    admin: "bg-destructive/10 text-destructive border-destructive/20",
    manager: "bg-primary/10 text-primary border-primary/20",
    technician: "bg-success/10 text-success border-success/20",
    requester: "bg-muted text-muted-foreground border-border",
  };

  const defaultPasswordsByEmail: Record<string, string> = {
    "admin@demo.com": "admin123",
    "manager@demo.com": "manager123",
    "tech1@demo.com": "tech12345",
    "tech2@demo.com": "tech12345",
    "user@demo.com": "user12345",
  };

  const demoUsers: User[] = useMemo(() => {
    // If backend user list is available, show it; otherwise show seeded demo users
    if (users?.length) return users;

    return [
      { id: "demo-admin", name: "Admin", email: "admin@demo.com", role: "admin" },
      { id: "demo-manager", name: "Manager", email: "manager@demo.com", role: "manager" },
      { id: "demo-tech1", name: "Tech One", email: "tech1@demo.com", role: "technician" },
      { id: "demo-tech2", name: "Tech Two", email: "tech2@demo.com", role: "technician" },
      { id: "demo-user", name: "Requester", email: "user@demo.com", role: "requester" },
    ] as User[];
  }, [users]);

  const selectUser = (u: User) => {
    setSelectedEmail(u.email);
    setPassword(defaultPasswordsByEmail[u.email] ?? "");
    setError("");
  };

  const handleLogin = async () => {
    setError("");

    if (!selectedEmail) {
      setError("Please select a user or enter an email.");
      return;
    }
    if (!password) {
      setError("Please enter password.");
      return;
    }

    const ok = await login(selectedEmail, password);
    if (!ok) setError("Login failed. Check email/password.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">GearGuard</CardTitle>
          <CardDescription>Ultimate Maintenance Tracker</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a demo user (recommended) or enter credentials.
          </p>

          <div className="space-y-2">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => selectUser(u)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedEmail === u.email
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>

                  <Badge variant="outline" className={roleColors[u.role] ?? roleColors.requester}>
                    {u.role}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-3 pt-2">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={selectedEmail}
                onChange={(e) => {
                  setSelectedEmail(e.target.value);
                  setError("");
                }}
                placeholder="admin@demo.com"
                autoComplete="username"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button onClick={handleLogin} className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in…
              </>
            ) : (
              "Continue"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Demo passwords are auto-filled when you select a user.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

