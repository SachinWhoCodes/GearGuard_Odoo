import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  List,
  LayoutGrid,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  Search,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceRequest, REQUEST_STAGES, RequestStage } from "@/types";
import { isOverdue, formatDate, getStageColor, getInitials, getDaysOverdue } from "@/lib/helpers";
import { staggerContainer, staggerItem } from "@/components/PageTransition";

export function RequestsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const equipmentFilter = searchParams.get("equipment");
  const { toast } = useToast();

  const { user, users } = useAuth();
  const { requests, equipment, teams, updateRequest, isLoadingData, refreshData } = useData();

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const [durationDialog, setDurationDialog] = useState<{
    open: boolean;
    requestId: string;
    targetStage: RequestStage;
  }>({ open: false, requestId: "", targetStage: "new" });

  const [durationHours, setDurationHours] = useState("");

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return requests.filter((r) => {
      if (equipmentFilter && r.equipmentId !== equipmentFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (teamFilter !== "all" && r.maintenanceTeamId !== teamFilter) return false;
      if (overdueOnly && !isOverdue(r)) return false;

      if (q) {
        const eq = equipment.find((e) => e.id === r.equipmentId);
        const haystack =
          `${r.subject} ${eq?.name ?? ""} ${eq?.serialNumber ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [requests, equipmentFilter, typeFilter, teamFilter, overdueOnly, searchQuery, equipment]);

  const groupedRequests = useMemo(() => {
    const groups: Record<RequestStage, MaintenanceRequest[]> = {
      new: [],
      in_progress: [],
      repaired: [],
      scrap: [],
    };
    filteredRequests.forEach((r) => groups[r.stage].push(r));
    return groups;
  }, [filteredRequests]);

  const getEquipmentName = (equipmentId: string) =>
    equipment.find((e) => e.id === equipmentId)?.name || "Unknown";

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || "Unknown";

  const getUserName = (userId?: string) =>
    userId ? users.find((u) => u.id === userId)?.name || "Unknown" : null;

  const canPickUp = (request: MaintenanceRequest) => {
    if (user?.role !== "technician") return false;
    const team = teams.find((t) => t.id === request.maintenanceTeamId);
    return team?.memberIds.includes(user.id) ?? false;
  };

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    setDraggedCard(requestId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: RequestStage) => {
    e.preventDefault();
    if (!draggedCard) return;

    const request = requests.find((r) => r.id === draggedCard);
    if (!request || request.stage === targetStage) {
      setDraggedCard(null);
      return;
    }

    // If moving to repaired needs duration
    if (targetStage === "repaired" && !request.durationHours) {
      setDurationDialog({ open: true, requestId: draggedCard, targetStage });
      setDraggedCard(null);
      return;
    }

    updateRequest(draggedCard, { stage: targetStage })
      .then?.(() => {
        toast({
          title: `Request moved to ${
            REQUEST_STAGES.find((s) => s.value === targetStage)?.label ?? targetStage
          }`,
        });
      })
      .catch?.(() => {
        toast({ title: "Failed to move request", variant: "destructive" });
      });

    setDraggedCard(null);
  };

  const handleDurationSubmit = () => {
    const hours = parseFloat(durationHours);
    if (isNaN(hours) || hours <= 0) {
      toast({ title: "Please enter a valid duration", variant: "destructive" });
      return;
    }

    updateRequest(durationDialog.requestId, {
      stage: durationDialog.targetStage,
      durationHours: hours,
    })
      .then?.(() => {
        toast({
          title: `Request marked as ${
            REQUEST_STAGES.find((s) => s.value === durationDialog.targetStage)?.label ??
            durationDialog.targetStage
          }`,
        });
      })
      .catch?.(() => toast({ title: "Failed to update request", variant: "destructive" }));

    setDurationDialog({ open: false, requestId: "", targetStage: "new" });
    setDurationHours("");
  };

  const handlePickUp = (requestId: string) => {
    if (!user) return;

    updateRequest(requestId, { assignedToId: user.id, stage: "in_progress" })
      .then?.(() => toast({ title: "Request assigned to you" }))
      .catch?.(() => toast({ title: "Failed to pick up request", variant: "destructive" }));
  };

  const stageColors: Record<RequestStage, string> = {
    new: "bg-muted/50 border-muted-foreground/20",
    in_progress: "bg-info/5 border-info/20",
    repaired: "bg-success/5 border-success/20",
    scrap: "bg-destructive/5 border-destructive/20",
  };

  const stageBadgeColors: Record<RequestStage, string> = {
    new: "bg-muted text-muted-foreground",
    in_progress: "bg-info/10 text-info",
    repaired: "bg-success/10 text-success",
    scrap: "bg-destructive/10 text-destructive",
  };

  const RequestCard = ({ request }: { request: MaintenanceRequest }) => {
    const overdue = isOverdue(request);
    const daysOver = getDaysOverdue(request);
    const assignedUser = getUserName(request.assignedToId);
    const teamName = getTeamName(request.maintenanceTeamId);

    return (
      <motion.div variants={staggerItem}>
        <Card
          draggable
          onDragStart={(e) => handleDragStart(e, request.id)}
          className={`cursor-grab active:cursor-grabbing hover:shadow-premium-md transition-all duration-200 border ${
            draggedCard === request.id ? "opacity-50 scale-95" : "hover:-translate-y-0.5"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1 pr-2">
                {request.subject}
              </h4>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/requests/${request.id}/edit`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate(`/requests/${request.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>

                  {canPickUp(request) && request.stage === "new" && (
                    <DropdownMenuItem onClick={() => handlePickUp(request.id)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Pick Up
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
              {getEquipmentName(request.equipmentId)}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {request.type === "corrective" ? "Corrective" : "Preventive"}
              </Badge>

              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {teamName}
              </Badge>

              {request.scheduledDate && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDate(request.scheduledDate)}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              {overdue ? (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {daysOver}d overdue
                </Badge>
              ) : (
                <div />
              )}

              {assignedUser ? (
                <div
                  className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary"
                  title={assignedUser}
                >
                  {getInitials(assignedUser)}
                </div>
              ) : request.stage === "new" && canPickUp(request) ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePickUp(request.id);
                  }}
                >
                  Pick up
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div>
      <PageHeader title="Maintenance Requests" description="Track and manage all maintenance work">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoadingData}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingData ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate("/requests/new")} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Request
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6 p-4 bg-card rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full lg:w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="corrective">Corrective</SelectItem>
            <SelectItem value="preventive">Preventive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={overdueOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setOverdueOnly(!overdueOnly)}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Overdue Only
        </Button>

        <div className="flex-1" />

        <div className="flex border border-border rounded-lg overflow-hidden">
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("kanban")}
            aria-label="Kanban view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {REQUEST_STAGES.map((stage) => (
            <div
              key={stage.value}
              className={`rounded-xl border p-4 ${stageColors[stage.value]}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit py-1">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge className={stageBadgeColors[stage.value]}>
                  {groupedRequests[stage.value].length}
                </Badge>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-3 min-h-[200px]"
              >
                {groupedRequests[stage.value].length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No requests</p>
                ) : (
                  groupedRequests[stage.value].map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))
                )}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredRequests.length === 0 ? (
              <EmptyState
                title="No requests found"
                description="Create your first maintenance request"
                action={
                  <Button onClick={() => navigate("/requests/new")} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Request
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subject</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Equipment</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stage</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-t border-border hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(`/requests/${request.id}/edit`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{request.subject}</span>
                            {isOverdue(request) && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {getEquipmentName(request.equipmentId)}
                        </td>
                        <td className="p-4">
                          <Badge className={getStageColor(request.stage)}>
                            {REQUEST_STAGES.find((s) => s.value === request.stage)?.label}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {request.scheduledDate ? formatDate(request.scheduledDate) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Duration dialog */}
      <Dialog
        open={durationDialog.open}
        onOpenChange={(open) => setDurationDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Duration</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              step="0.5"
              min="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="e.g., 2.5"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">Duration is required to mark as repaired</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDurationDialog({ open: false, requestId: "", targetStage: "new" });
                setDurationHours("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleDurationSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

