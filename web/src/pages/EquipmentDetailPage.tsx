import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Wrench,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Users,
  QrCode,
  Copy,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { EQUIPMENT_CATEGORIES } from "@/types";
import { formatDate } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL as string | undefined;

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { equipment, teams, requests } = useData();
  const { users } = useAuth();

  const eq = useMemo(() => equipment.find((e) => e.id === id), [equipment, id]);

  if (!eq) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={() => navigate("/equipment")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Equipment
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Equipment not found</p>
        </div>
      </div>
    );
  }

  const team = teams.find((t) => t.id === eq.maintenanceTeamId);
  const defaultTechnician = users.find((u) => u.id === eq.defaultTechnicianId);

  const categoryLabel =
    EQUIPMENT_CATEGORIES.find((c) => c.value === eq.category)?.label ?? eq.category;

  const equipmentRequests = requests.filter((r) => r.equipmentId === eq.id);
  const openRequestCount = equipmentRequests.filter(
    (r) => r.stage === "new" || r.stage === "in_progress"
  ).length;

  const isWarrantyExpired = eq.warrantyExpiry ? new Date(eq.warrantyExpiry) < new Date() : false;

  const scanUrl = `${window.location.origin}/scan/${eq.id}`;
  const qrImageUrl = API_BASE_URL ? `${API_BASE_URL}/api/v1/equipment/${eq.id}/qr` : null;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/equipment")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Equipment
      </Button>

      <PageHeader
        title={eq.name}
        description={`Serial: ${eq.serialNumber}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => navigate(`/requests?equipment=${eq.id}`)} variant="outline">
            <Wrench className="h-4 w-4 mr-2" />
            Maintenance
            {openRequestCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-warning/10 text-warning">
                {openRequestCount}
              </Badge>
            )}
          </Button>

          <Button onClick={() => navigate(`/equipment/${eq.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </PageHeader>

      {/* Status badges row */}
      <div className="flex flex-wrap items-center gap-2 -mt-2 mb-6">
        <Badge variant="outline">{categoryLabel}</Badge>
        {eq.isScrapped && (
          <Badge variant="destructive" className="text-sm">
            <AlertTriangle className="h-3 w-3 mr-1" />
            SCRAPPED / UNUSABLE
          </Badge>
        )}
        {isWarrantyExpired && (
          <Badge variant="outline" className="border-destructive/30 text-destructive">
            Warranty Expired
          </Badge>
        )}
      </div>

      {eq.isScrapped && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">This equipment has been scrapped</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Scrapped on {eq.scrappedAt ? formatDate(eq.scrappedAt) : "—"}
                  {eq.scrappedReason ? ` — ${eq.scrappedReason}` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{categoryLabel}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{eq.department}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{eq.location}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{eq.ownerEmployeeName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase & Warranty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Purchase & Warranty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{eq.purchaseDate ? formatDate(eq.purchaseDate) : "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className={`font-medium ${isWarrantyExpired ? "text-destructive" : ""}`}>
                    {eq.warrantyExpiry ? formatDate(eq.warrantyExpiry) : "—"}
                    {isWarrantyExpired ? " (Expired)" : ""}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Maintenance Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Team</p>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{team?.name ?? "Unknown"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Default Technician</p>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{defaultTechnician?.name ?? "Unknown"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR + Request summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">QR & Request Summary</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/scan/${eq.id}`}>
                <QrCode className="h-4 w-4 mr-2" />
                Open Scan
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* QR block */}
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Equipment QR</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scan to open: <span className="font-mono">{`/scan/${eq.id}`}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyText(scanUrl)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-center">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Equipment QR"
                    className="h-40 w-40 rounded-md border bg-background"
                  />
                ) : (
                  <div className="h-40 w-40 rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground text-center p-3">
                    QR image will appear when backend endpoint is enabled:
                    <div className="mt-2 font-mono text-[10px] leading-tight">
                      /api/v1/equipment/{eq.id}/qr
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Request summary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-semibold text-foreground">{equipmentRequests.length}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-warning">{openRequestCount}</p>
                <p className="text-sm text-muted-foreground">Open Requests</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="flex-1 min-w-[180px]"
                onClick={() => navigate(`/requests?equipment=${eq.id}`)}
                disabled={equipmentRequests.length === 0}
              >
                View All Requests
              </Button>

              <Button
                className="flex-1 min-w-[180px]"
                onClick={() => navigate(`/requests/new?equipment=${encodeURIComponent(eq.id)}`)}
              >
                Create Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

