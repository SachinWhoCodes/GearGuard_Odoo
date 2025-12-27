import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Clock, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { isOverdue, formatDate } from "@/lib/helpers";

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarPage() {
  const navigate = useNavigate();
  const { requests, equipment, isLoadingData, refreshData } = useData();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const preventiveRequests = useMemo(() => {
    return requests.filter((r) => r.type === "preventive" && r.scheduledDate);
  }, [requests]);

  const requestMap = useMemo(() => {
    // key: YYYY-MM-DD -> requests[]
    const map = new Map<string, typeof preventiveRequests>();
    for (const r of preventiveRequests) {
      const key = r.scheduledDate!;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return map;
  }, [preventiveRequests]);

  const getEquipmentName = (equipmentId: string) =>
    equipment.find((e) => e.id === equipmentId)?.name || "Unknown";

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    navigate(`/requests/new?date=${dateStr}`);
  };

  const today = new Date();

  // Build calendar grid
  const daysCells: React.ReactNode[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    daysCells.push(
      <div
        key={`empty-${i}`}
        className="h-24 sm:h-32 border border-border/50 bg-muted/20 rounded-none"
      />
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = toISODate(dateObj);
    const dayRequests = requestMap.get(dateStr) ?? [];
    const isToday = isSameDay(dateObj, today);

    daysCells.push(
      <div
        key={day}
        className={`h-24 sm:h-32 border border-border/50 p-1.5 sm:p-2 overflow-hidden hover:bg-muted/30 transition-colors cursor-pointer ${
          isToday ? "bg-primary/5 border-primary/30" : ""
        }`}
        onClick={() => handleDateClick(day)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleDateClick(day);
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
            {day}
          </span>

          {dayRequests.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {dayRequests.length}
            </Badge>
          )}
        </div>

        <div className="space-y-1 overflow-hidden">
          {dayRequests.slice(0, 2).map((req) => {
            const overdue = isOverdue(req);
            return (
              <div
                key={req.id}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/requests/${req.id}/edit`);
                }}
                className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                  overdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                }`}
                title={req.subject}
              >
                {req.subject}
              </div>
            );
          })}

          {dayRequests.length > 2 && (
            <div className="text-xs text-muted-foreground">+{dayRequests.length - 2} more</div>
          )}
        </div>
      </div>
    );
  }

  const upcoming = useMemo(() => {
    const now0 = startOfDay(new Date());
    return preventiveRequests
      .filter((r) => {
        const d = new Date(r.scheduledDate!);
        return !Number.isNaN(d.getTime()) && startOfDay(d) >= now0;
      })
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
      .slice(0, 6);
  }, [preventiveRequests]);

  const upcomingCount = useMemo(() => {
    const now0 = startOfDay(new Date());
    return preventiveRequests.filter((r) => startOfDay(new Date(r.scheduledDate!)) >= now0).length;
  }, [preventiveRequests]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Calendar" description="Preventive maintenance schedule">
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

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {monthNames[month]} {year}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {preventiveRequests.length} preventive request{preventiveRequests.length === 1 ? "" : "s"} (all time)
              </p>
            </div>

            <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {dayNames.map((name) => (
              <div
                key={name}
                className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted/50"
              >
                {name}
              </div>
            ))}
            {daysCells}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Upcoming Preventive Maintenance</h3>
            <Badge variant="secondary">{upcomingCount}</Badge>
          </div>

          <div className="space-y-2">
            {upcoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => navigate(`/requests/${req.id}/edit`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{req.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{getEquipmentName(req.equipmentId)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(req.scheduledDate!)}
                  </span>
                </div>
              </div>
            ))}

            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming preventive maintenance scheduled
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

