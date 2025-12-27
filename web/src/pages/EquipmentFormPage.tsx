import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, EQUIPMENT_CATEGORIES, EquipmentCategory } from "@/types";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  serialNumber: z.string().min(1, "Serial number is required").max(50),
  category: z.string().min(1, "Category is required"),
  department: z.string().min(1, "Department is required"),
  ownerEmployeeName: z.string().min(1, "Owner is required").max(100),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  warrantyExpiry: z.string().min(1, "Warranty expiry is required"),
  location: z.string().min(1, "Location is required").max(200),
  maintenanceTeamId: z.string().min(1, "Maintenance team is required"),
  defaultTechnicianId: z.string().min(1, "Default technician is required"),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export function EquipmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { equipment, teams, addEquipment, updateEquipment, isLoadingData } = useData();
  const { users } = useAuth();

  const isEdit = Boolean(id && id !== "new");
  const existingEquipment = useMemo(
    () => (isEdit ? equipment.find((e) => e.id === id) : null),
    [equipment, id, isEdit]
  );

  const technicians = useMemo(() => users.filter((u) => u.role === "technician"), [users]);

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      serialNumber: "",
      category: "",
      department: "",
      ownerEmployeeName: "",
      purchaseDate: "",
      warrantyExpiry: "",
      location: "",
      maintenanceTeamId: "",
      defaultTechnicianId: "",
    },
  });

  // Populate form when editing once data is loaded
  useEffect(() => {
    if (!isEdit) return;

    // If edit but not found, wait for data load then show message
    if (!existingEquipment) return;

    form.reset({
      name: existingEquipment.name,
      serialNumber: existingEquipment.serialNumber,
      category: existingEquipment.category,
      department: existingEquipment.department,
      ownerEmployeeName: existingEquipment.ownerEmployeeName,
      purchaseDate: existingEquipment.purchaseDate,
      warrantyExpiry: existingEquipment.warrantyExpiry,
      location: existingEquipment.location,
      maintenanceTeamId: existingEquipment.maintenanceTeamId,
      defaultTechnicianId: existingEquipment.defaultTechnicianId,
    });
  }, [existingEquipment, form, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    if (isLoadingData) return;

    if (!existingEquipment) {
      toast({ title: "Equipment not found", variant: "destructive" });
      navigate("/equipment");
    }
  }, [existingEquipment, isEdit, isLoadingData, navigate, toast]);

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      if (isEdit && existingEquipment) {
        await updateEquipment(existingEquipment.id, {
          ...data,
          category: data.category as EquipmentCategory,
        });
        toast({ title: "Equipment updated successfully" });
      } else {
        await addEquipment({
          name: data.name,
          serialNumber: data.serialNumber,
          category: data.category as EquipmentCategory,
          department: data.department,
          ownerEmployeeName: data.ownerEmployeeName,
          purchaseDate: data.purchaseDate,
          warrantyExpiry: data.warrantyExpiry,
          location: data.location,
          maintenanceTeamId: data.maintenanceTeamId,
          defaultTechnicianId: data.defaultTechnicianId,
          isScrapped: false,
        });
        toast({ title: "Equipment created successfully" });
      }
      navigate("/equipment");
    } catch (e: any) {
      toast({
        title: "Error saving equipment",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/equipment")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Equipment
      </Button>

      <PageHeader
        title={isEdit ? "Edit Equipment" : "Add Equipment"}
        description={isEdit ? "Update equipment information" : "Register a new piece of equipment"}
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          {isLoadingData && isEdit && !existingEquipment ? (
            <div className="py-10 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading equipment…
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="CNC Machine" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input placeholder="CNC-2021-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EQUIPMENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerEmployeeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner / Employee</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Building A - Floor 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warrantyExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maintenanceTeamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Team</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultTechnicianId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Technician</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select technician" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {technicians.map((tech) => (
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

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEdit ? "Updating…" : "Creating…"}
                      </>
                    ) : isEdit ? (
                      "Update Equipment"
                    ) : (
                      "Create Equipment"
                    )}
                  </Button>

                  <Button type="button" variant="outline" onClick={() => navigate("/equipment")}>
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

