import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, AlertTriangle, Wrench, QrCode, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";

import { useData } from "@/contexts/DataContext";
import { EQUIPMENT_CATEGORIES, DEPARTMENTS } from "@/types";

export function EquipmentListPage() {
  const navigate = useNavigate();
  const { equipment, teams, requests, isLoadingData, refreshData } = useData();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [scrappedFilter, setScrappedFilter] = useState<string>("active");

  const getOpenRequestCount = (equipmentId: string) =>
    requests.filter(
      (r) => r.equipmentId === equipmentId && (r.stage === "new" || r.stage === "in_progress")
    ).length;

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || "Unknown";

  const filteredEquipment = useMemo(() => {
    const q = search.trim().toLowerCase();

    return equipment.filter((eq) => {
      const matchesSearch =
        !q ||
        eq.name.toLowerCase().includes(q) ||
        eq.serialNumber.toLowerCase().includes(q) ||
        eq.ownerEmployeeName.toLowerCase().includes(q);

      const matchesCategory = categoryFilter === "all" || eq.category === categoryFilter;
      const matchesDepartment = departmentFilter === "all" || eq.department === departmentFilter;

      const matchesScrapped =
        scrappedFilter === "all" ||
        (scrappedFilter === "active" && !eq.isScrapped) ||
        (scrappedFilter === "scrapped" && eq.isScrapped);

      return matchesSearch && matchesCategory && matchesDepartment && matchesScrapped;
    });
  }, [equipment, search, categoryFilter, departmentFilter, scrappedFilter]);

  const isFiltered =
    Boolean(search.trim()) ||
    categoryFilter !== "all" ||
    departmentFilter !== "all" ||
    scrappedFilter !== "all";

  return (
    <div className="animate-fade-in">
      <PageHeader title="Equipment" description="Manage your equipment registry">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoadingData}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingData ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={() => navigate("/scan")}>
            <QrCode className="h-4 w-4 mr-1" />
            Scan QR
          </Button>

          <Button onClick={() => navigate("/equipment/new")} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Equipment
          </Button>
        </div>
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, serial, or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={scrappedFilter} onValueChange={setScrappedFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scrapped">Scrapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredEquipment.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No equipment found"
          description={
            isFiltered ? "Try adjusting your filters" : "Add your first piece of equipment to get started"
          }
          action={
            <Button onClick={() => navigate("/equipment/new")} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Equipment
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEquipment.map((eq) => {
            const openCount = getOpenRequestCount(eq.id);
            const categoryLabel =
              EQUIPMENT_CATEGORIES.find((c) => c.value === eq.category)?.label || eq.category;

            return (
              <Card
                key={eq.id}
                className={`cursor-pointer hover:shadow-md transition-all ${eq.isScrapped ? "opacity-75" : ""}`}
                onClick={() => navigate(`/equipment/${eq.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{eq.name}</h3>
                      <p className="text-xs text-muted-foreground">{eq.serialNumber}</p>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      {openCount > 0 && (
                        <Badge variant="secondary" className="bg-warning/10 text-warning">
                          {openCount} open
                        </Badge>
                      )}
                      {eq.isScrapped && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Scrapped
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Category</span>
                      <span className="text-foreground truncate">{categoryLabel}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Department</span>
                      <span className="text-foreground truncate">{eq.department}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Team</span>
                      <span className="text-foreground truncate">{getTeamName(eq.maintenanceTeamId)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="text-foreground truncate max-w-[160px]">
                        {eq.ownerEmployeeName}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

