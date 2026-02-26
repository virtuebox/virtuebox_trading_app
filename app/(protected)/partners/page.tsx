"use client";

/**
 * app/(protected)/partners/page.tsx
 * Partner Management — ADMIN only.
 * Shows a creation form and a table of all partners.
 */

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserPlus, Users } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  partnerId?: string;
  isActive: boolean;
  role: string;
  createdBy?: string;
  createdAt: string;
}

interface PartnerFormValues {
  name: string;
  email: string;
  password: string;
  mobile: string;
  isActive: boolean;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      mobile: "",
      isActive: true,
    },
  });

  const fetchPartners = useCallback(async () => {
    setLoadingPartners(true);
    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners ?? []);
      }
    } catch {
      toast.error("Failed to load partners");
    } finally {
      setLoadingPartners(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const onSubmit = async (values: PartnerFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        form.setError("root", {
          message: data.message ?? "Failed to create partner",
        });
        toast.error(data.message ?? "Failed to create partner");
        return;
      }

      toast.success(`Partner ${data.partner.partnerId} created successfully!`);
      form.reset();
      fetchPartners();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Partner Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create and manage trading partners.
        </p>
      </div>

      {/* Create Partner Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Add New Partner</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                A unique Partner ID (VBP-series) will be auto-generated upon creation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="partner@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  rules={{
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Min. 6 characters"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mobile */}
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="9876543210"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* isActive Toggle */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="isActive"
                        />
                      </FormControl>
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Active Account
                      </Label>
                    </div>
                  </FormItem>
                )}
              />

              {/* Root error */}
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Creating…" : "Create Partner"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">All Partners</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {loadingPartners
                  ? "Loading…"
                  : `${partners.length} partner${partners.length !== 1 ? "s" : ""} total`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPartners ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No partners yet. Create your first partner above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-mono font-medium text-sm">
                        {partner.partnerId ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {partner.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {partner.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {partner.mobile ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={partner.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {partner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {partner.createdBy ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(partner.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
