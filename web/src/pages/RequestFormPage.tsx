import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RequestType, EquipmentCategory, EQUIPMENT_CATEGORIES } from "@/types";

const requestSchema = z.object({
  type: z.enum(["corrective", "preventive"]),
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().min(1, "Description is required").max(1000),
  equipmentId: z.string().min(1, "Equipment is required"),
  scheduledDate: z.string().optional(),
  durationHours: z.coerce.number().optional(),
  assignedToId: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export function RequestFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const prefillDate = searchParams.get("date") ?? "";
  const prefillEquipment = searchParams.get("equipment") ?? "";

  const { user, users } = useAuth();
  const { requests, equipment, teams, addRequest, updateRequest, isLoadingData } = useData();

  const isEdit = Boolean(id && id !== "new");
  const existingRequest = useMemo(
    () => (isEdit ? requests.find((r) => r.id === id) : null),
    [id, isEdit, requests]
  );

  const technicians = useMemo(() => users.filter((u) => u.role === "technician"), [users]);
  const activeEquipment = useMemo(() => equipment.filter((e) => !e.isScrapped), [equipment]);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: prefillDate ? "preventive" : "corrective",
      subject: "",
      description: "",
      equipmentId: prefillEquipment,
      scheduledDate: prefillDate,
      durationHours: undefined,
      assignedToId: "unassigned",
    },
  });

  // hydrate edit values once data is available
  useEffect(() => {
    if (!isEdit) return;
    if (!existingRequest) return;

    form.reset({
      type: existingRequest.type,
      subject: existingRequest.subject,
      description: existingRequest.description,
      equipmentId: existingRequest.equipmentId,
      scheduledDate: existingRequest.scheduledDate ?? "",
      durationHours: existingRequest.durationHours,
      assignedToId: existingRequest.assignedToId ?? "unassigned",
    });
  }, [existingRequest, form, isEdit]);

  // if edit but not found after loading, bounce
  useEffect(() => {
    if (!isEdit) return;
    if (isLoadingData) return;

    if (!existingRequest) {
      toast({ title: "Request not found", variant: "destructive" });
      navigate("/requests");
    }
  }, [existingRequest, isEdit, isLoadingData, navigate, toast]);

  const selectedEquipmentId = form.watch("equipmentId");
  const requestType = form.watch("type");

  const selectedEquipment = useMemo(
    () => equipment.find((e) => e.id === selectedEquipmentId),
    [equipment, selectedEquipmentId]
  );

  const selectedTeam = useMemo(() => {
    if (!selectedEquipment) return null;
    return teams.find((t) => t.id === selectedEquipment.maintenanceTeamId) ?? null;
  }, [selectedEquipment, teams]);

  const categoryLabel = useMemo(() => {
    if (!selectedEquipment) return "";
    return (
      EQUIPMENT_CATEGORIES.find((c) => c.value === selectedEquipment.category)?.label ??
      selectedEquipment.category
    );
  }, [selectedEquipment]);

  // Filter technicians by team if possible
  const availableTechnicians = useMemo(() => {
    if (!selectedTeam) return technicians;
    return technicians.filter((t) => selectedTeam.memberIds.includes(t.id));
  }, [selectedTeam, technicians]);

  const onSubmit = async (data: RequestFormData) => {
    const eq = equipment.find((e) => e.id === data.equipmentId);

    if (!eq) {
      toast({ title: "Please select equipment", variant: "destructive" });
      return;
    }

    if (data.type === "preventive" && !data.scheduledDate) {
      toast({
        title: "Scheduled date is required for preventive maintenance",
        variant: "destructive",
      });
      return;
    }

    try {
      const requestData = {
        type: data.type as RequestType,
        subject: data.subject,
        description: data.description,
        equipmentId: data.equipmentId,
        equipmentCategory: eq.category as EquipmentCategory,
        maintenanceTeamId: eq.maintenanceTeamId,
        scheduledDate: data.scheduledDate || undefined,
        durationHours: isEdit ? data.durationHours || undefined : undefined,
        assignedToId:
          !data.assignedToId || data.assignedToId === "unassigned" ? undefined : data.assignedToId,
      };

      if (isEdit && existingRequest) {
        await updateRequest(existingRequest.id, requestData);
        toast({ title: "Request updated successfully" });
      } else {
        await addRequest({
          ...requestData,
          stage: "new",
          createdById: user?.id || "",
        });
        toast({ title: "Request created successfully" });
      }

      navigate("/requests");
    } catch (e: any) {
      toast({
        title: "Error saving request",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/requests")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </Button>

      <PageHeader
        title={isEdit ? "Edit Request" : "New Maintenance Request"}
        description={isEdit ? "Update request details" : "Create a new maintenance request"}
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          {isLoadingData && isEdit && !existingRequest ? (
            <div className="py-10 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading request…
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          // If user switches to corrective, clear scheduled date (optional)
                          if (v === "corrective") form.setValue("scheduledDate", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corrective">Corrective</SelectItem>
                          <SelectItem value="preventive">Preventive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select equipment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeEquipment.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.name} ({eq.serialNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedEquipment && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Category (auto-filled)</p>
                      <p className="font-medium">{categoryLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Maintenance Team (auto-filled)</p>
                      <p className="font-medium">{selectedTeam?.name || "Unknown"}</p>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the issue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of the maintenance request"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Scheduled Date
                          {requestType === "preventive" && <span className="text-destructive ml-1">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={requestType === "corrective"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "unassigned"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select technician" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {availableTechnicians.map((tech) => (
                              <SelectItem key={tech.id} value={tech.id}>
                                {tech.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isEdit && (
                  <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="e.g., 2.5"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEdit ? "Updating…" : "Creating…"}
                      </>
                    ) : isEdit ? (
                      "Update Request"
                    ) : (
                      "Create Request"
                    )}
                  </Button>

                  <Button type="button" variant="outline" onClick={() => navigate("/requests")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

