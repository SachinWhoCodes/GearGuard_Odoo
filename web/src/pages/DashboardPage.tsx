import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Plus,
  LayoutGrid,
  Calendar,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { isOverdue } from "@/lib/helpers";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function DashboardPage() {
  const navigate = useNavigate();
  const { equipment, requests, teams, isLoadingData, refreshData } = useData();

  const {
    totalEquipment,
    activeEquipment,
    openRequests,
    overdueRequests,
    repairedThisWeek,
    requestsByTeam,
  } = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const totalEquipment = equipment.length;
    const activeEquipment = equipment.filter((e) => !e.isScrapped).length;

    const openRequests = requests.filter(
      (r) => r.stage === "new" || r.stage === "in_progress"
    ).length;

    const overdueRequests = requests.filter((r) => isOverdue(r)).length;

    const repairedThisWeek = requests.filter((r) => {
      if (r.stage !== "repaired") return false;
      const updatedAt = r.updatedAt ? new Date(r.updatedAt) : null;
      return updatedAt ? updatedAt >= weekAgo : false;
    }).length;

    // Requests-by-team chart:
    // - If teams list is available (admin/manager), use names.
    // - If not (technician/requester), fall back to team IDs discovered in requests.
    let requestsByTeam: { name: string; count: number }[] = [];

    if (teams?.length) {
      requestsByTeam = teams.map((team) => ({
        name: team.name,
        count: requests.filter((r) => r.maintenanceTeamId === team.id).length,
      }));
    } else {
      const counts = new Map<string, number>();
      for (const r of requests) {
        counts.set(r.maintenanceTeamId, (counts.get(r.maintenanceTeamId) ?? 0) + 1);
      }
      requestsByTeam = Array.from(counts.entries()).map(([teamId, count]) => ({
        name: `Team ${teamId.slice(0, 6)}`,
        count,
      }));
    }

    return {
      totalEquipment,
      activeEquipment,
      openRequests,
      overdueRequests,
      repairedThisWeek,
      requestsByTeam,
    };
  }, [equipment, requests, teams]);

  const chartColors = [
    "hsl(199, 89%, 48%)",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 68%, 60%)",
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="Overview of your maintenance operations">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={isLoadingData}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingData ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button onClick={() => navigate("/requests/new")} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Request
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Equipment"
          value={activeEquipment}
          subtitle={`${totalEquipment - activeEquipment} scrapped`}
          icon={Wrench}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Open Requests"
          value={openRequests}
          subtitle="New + In Progress"
          icon={ClipboardList}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Overdue"
          value={overdueRequests}
          subtitle="Past scheduled date"
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Repaired This Week"
          value={repairedThisWeek}
          subtitle="Last 7 days"
          icon={CheckCircle}
          iconClassName="bg-success/10 text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Requests by Team</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Loading chart…
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestsByTeam} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {requestsByTeam.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/requests/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Request
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/equipment/new")}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/requests")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              View Kanban
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/calendar")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/scan")}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

