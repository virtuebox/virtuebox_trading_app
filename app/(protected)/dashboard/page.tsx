"use client";

/**
 * app/(protected)/dashboard/page.tsx
 * Gold — Partner Management Dashboard
 * Features: two data tables, Add/Edit dialog, soft-delete toggle.
 * All financial calculation fields default to 0; logic added in future sprints.
 */

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Plus, Pencil, PowerOff, Power, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Monthly {
  jan: number; feb: number; mar: number; apr: number;
  may: number; jun: number; jul: number; aug: number;
  sep: number; oct: number; nov: number; dec: number;
}

interface Partner {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  partnerId?: string;
  isActive: boolean;
  deposit: number;
  sharePercent: number;
  feePercent?: number;
  startDate?: string;
  endDate?: string;
  totalWithdrawals: number;
  capitalDue: number;
  roi: number;
  currentMonthUSD: number;
  currentMonthINR: number;
  backupBalance: number;
  icMarketAccount?: string;
  tradingAgreement?: string;
  monthly: Monthly;
}

interface FormValues {
  name: string;
  email: string;
  password: string;
  mobile: string;
  deposit: number;
  sharePercent: number;
  feePercent: string;
  startDate: string;
  endDate: string;
  icMarketAccount: string;
  tradingAgreement: string;
  isActive: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const fmtINR = (n: number | undefined | null) =>
  "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (n: number | undefined | null) =>
  (n ?? 0).toFixed(2) + "%";

const fmtDate = (d?: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
};

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"] as const;
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const monthlyTotal = (m: Monthly | undefined) =>
  MONTHS.reduce((s, k) => s + ((m?.[k]) ?? 0), 0);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Total backup balance — shown as merged cell (sum of all partners' backupBalance)
  const totalBackupBalance = partners.reduce((s, p) => s + (p.backupBalance ?? 0), 0);

  // ── Fetch partners ────────────────────────────────────────────────────────
  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partners");
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners);
        setUserRole(data.role);
      }
    } catch {
      toast.error("Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // ── Form ────────────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    defaultValues: {
      name: "", email: "", password: "", mobile: "",
      deposit: 0, sharePercent: 0, feePercent: "",
      startDate: "", endDate: "",
      icMarketAccount: "", tradingAgreement: "", isActive: true,
    },
  });

  const openAdd = () => {
    setEditTarget(null);
    form.reset({
      name: "", email: "", password: "", mobile: "",
      deposit: 0, sharePercent: 0, feePercent: "",
      startDate: "", endDate: "",
      icMarketAccount: "", tradingAgreement: "", isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditTarget(p);
    form.reset({
      name: p.name,
      email: p.email,
      password: "",
      mobile: p.mobile ?? "",
      deposit: p.deposit,
      sharePercent: p.sharePercent,
      feePercent: p.feePercent != null ? String(p.feePercent) : "",
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.slice(0, 10) : "",
      icMarketAccount: p.icMarketAccount ?? "",
      tradingAgreement: p.tradingAgreement ?? "",
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      email: values.email,
      mobile: values.mobile || undefined,
      deposit: Number(values.deposit),
      sharePercent: Number(values.sharePercent),
      feePercent: values.feePercent !== "" ? Number(values.feePercent) : undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      icMarketAccount: values.icMarketAccount || undefined,
      tradingAgreement: values.tradingAgreement || undefined,
      isActive: values.isActive,
      ...(values.password ? { password: values.password } : {}),
    };

    try {
      if (editTarget) {
        // Update existing partner
        const res = await fetch(`/api/partners/${editTarget._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast.success("Partner updated");
      } else {
        // Create new partner
        if (!values.password) {
          form.setError("password", { message: "Password is required" });
          return;
        }
        const res = await fetch("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, password: values.password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast.success("Partner created");
      }
      setDialogOpen(false);
      fetchPartners();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Operation failed";
      toast.error(msg);
    }
  };

  const toggleActive = async (p: Partner) => {
    setSavingId(p._id);
    try {
      const res = await fetch(`/api/partners/${p._id}`, { method: "PATCH" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      fetchPartners();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingId(null);
    }
  };

  // ── Aggregated totals ──────────────────────────────────────────────────
  const activePartners = partners; // show all — greyed if inactive
  const totalDeposit = activePartners.reduce((s, p) => s + p.deposit, 0);
  const totalWithdrawals = activePartners.reduce((s, p) => s + p.totalWithdrawals, 0);
  const totalCapitalDue = activePartners.reduce((s, p) => s + p.capitalDue, 0);
  const totalCurrentUSD = activePartners.reduce((s, p) => s + p.currentMonthUSD, 0);
  const totalCurrentINR = activePartners.reduce((s, p) => s + p.currentMonthINR, 0);
  const totalSharePct = activePartners.reduce((s, p) => s + p.sharePercent, 0);

  const monthlyTotals: Monthly = MONTHS.reduce((acc, m) => {
    acc[m] = activePartners.reduce((s, p) => s + (p.monthly?.[m] ?? 0), 0);
    return acc;
  }, {} as Monthly);

  const grandMonthlyTotal = monthlyTotal(monthlyTotals);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden shadow-md border">
        <div className="bg-[#1a1a2e] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 rounded p-1.5">
              <span className="text-black font-extrabold text-sm leading-none">VB</span>
            </div>
            <div>
              <p className="text-amber-400 font-bold text-lg leading-tight">
                Gold &mdash; <span className="text-white">Partner Management</span>
              </p>
              <p className="text-gray-400 text-xs">www.virtuebox.com</p>
            </div>
          </div>
          {userRole === "ADMIN" && (
            <Button
              id="btn-add-partner"
              onClick={openAdd}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Partner
            </Button>
          )}
        </div>
      </div>

      {/* ── Table 1 — Partner Summary ───────────────────────────── */}
      <div className="rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-[#1a1a2e] px-4 py-2">
          <p className="text-amber-400 font-semibold text-sm tracking-wide">
            Partner Overview
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-bold text-gray-700 whitespace-nowrap">Partner</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap text-right">Deposit&apos;s ($)</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap text-right">Share %</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap text-right">Fee %</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap">Start Date</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap">End Date</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap text-right">Total Withdrawals</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap text-right">Capital Due</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap text-right">ROI %</TableHead>
                <TableHead className="font-bold text-center whitespace-nowrap bg-yellow-100 text-yellow-800">
                  Current Month ($)
                </TableHead>
                <TableHead className="font-bold text-center whitespace-nowrap bg-yellow-100 text-yellow-800">
                  Current Month (₹)
                </TableHead>
                <TableHead className="font-bold text-center whitespace-nowrap bg-amber-50 text-amber-800">
                  Backup A/C Balance
                </TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap">IC Market Accounts</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap">Trading Agreement</TableHead>
                <TableHead className="font-bold text-gray-700 whitespace-nowrap text-center">Status</TableHead>
                {userRole === "ADMIN" && (
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap text-center">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading partners…
                  </TableCell>
                </TableRow>
              ) : partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-12 text-muted-foreground">
                    No partners yet. Click &quot;Add Partner&quot; to get started.
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((p) => (
                  <TableRow
                    key={p._id}
                    className={p.isActive ? "" : "opacity-50 bg-gray-50"}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      <div>{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.partnerId}</div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{fmt$(p.deposit)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{fmtPct(p.sharePercent)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {p.feePercent != null ? p.feePercent : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(p.startDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(p.endDate)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{fmt$(p.totalWithdrawals)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{fmt$(p.capitalDue)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{fmtPct(p.roi)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap bg-yellow-50 font-semibold text-green-700">
                      {fmt$(p.currentMonthUSD)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap bg-yellow-50 font-semibold text-green-700">
                      {fmtINR(p.currentMonthINR)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap bg-amber-50 font-bold text-amber-800">
                      {fmt$(p.backupBalance)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm max-w-[140px] truncate" title={p.icMarketAccount}>
                      {p.icMarketAccount || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm max-w-[120px] truncate" title={p.tradingAgreement}>
                      {p.tradingAgreement || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {userRole === "ADMIN" && (
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            id={`btn-edit-${p._id}`}
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => openEdit(p)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            id={`btn-toggle-${p._id}`}
                            size="icon"
                            variant={p.isActive ? "outline" : "outline"}
                            className={`h-7 w-7 ${p.isActive ? "text-red-500 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                            onClick={() => toggleActive(p)}
                            disabled={savingId === p._id}
                            title={p.isActive ? "Deactivate" : "Activate"}
                          >
                            {savingId === p._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : p.isActive ? (
                              <PowerOff className="h-3.5 w-3.5" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>

            {/* Totals footer */}
            {!loading && partners.length > 0 && (
              <TableFooter>
                <TableRow className="bg-gray-100 font-bold">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right">{fmt$(totalDeposit)}</TableCell>
                  <TableCell className="text-right">{fmtPct(totalSharePct)}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right">{fmt$(totalWithdrawals)}</TableCell>
                  <TableCell className="text-right">{fmt$(totalCapitalDue)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right bg-yellow-100 text-green-700">{fmt$(totalCurrentUSD)}</TableCell>
                  <TableCell className="text-right bg-yellow-100 text-green-700">{fmtINR(totalCurrentINR)}</TableCell>
                  <TableCell className="text-right bg-amber-100 text-amber-900 font-bold">{fmt$(totalBackupBalance)}</TableCell>
                  <TableCell colSpan={userRole === "ADMIN" ? 4 : 3} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      {/* ── Table 2 — Monthly Breakdown ─────────────────────────── */}
      {!loading && partners.length > 0 && (
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-[#1a1a2e] px-4 py-2">
            <p className="text-amber-400 font-semibold text-sm tracking-wide">
              Monthly Breakdown (USD)
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap sticky left-0 bg-gray-50 z-10">
                    Partner
                  </TableHead>
                  {MONTH_LABELS.map((m, i) => (
                    <TableHead key={i} className="font-bold text-gray-700 text-right whitespace-nowrap">
                      {m}
                    </TableHead>
                  ))}
                  <TableHead className="font-bold text-gray-700 text-right whitespace-nowrap bg-yellow-100 text-yellow-800">
                    Total ($)
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-right whitespace-nowrap bg-yellow-100 text-yellow-800">
                    Total (₹)
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {partners.map((p) => {
                  const mTotal = monthlyTotal(p.monthly ?? {
                    jan:0,feb:0,mar:0,apr:0,may:0,jun:0,
                    jul:0,aug:0,sep:0,oct:0,nov:0,dec:0
                  });
                  const inrTotal = p.currentMonthINR > 0
                    ? (mTotal / (p.currentMonthUSD || 1)) * p.currentMonthINR
                    : 0;

                  return (
                    <TableRow
                      key={p._id}
                      className={p.isActive ? "" : "opacity-50 bg-gray-50"}
                    >
                      <TableCell className="font-medium sticky left-0 bg-white z-10 whitespace-nowrap">
                        {p.name}
                      </TableCell>
                      {MONTHS.map((m) => {
                        const val = p.monthly?.[m] ?? 0;
                        return (
                          <TableCell
                            key={m}
                            className={`text-right whitespace-nowrap text-sm ${
                              val < 0 ? "text-red-600" : val > 0 ? "text-gray-800" : "text-gray-400"
                            }`}
                          >
                            {fmt$(val)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-semibold whitespace-nowrap bg-yellow-50 text-green-700">
                        {fmt$(mTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap bg-yellow-50 text-green-700">
                        {fmtINR(inrTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow className="bg-gray-100 font-bold">
                  <TableCell className="font-bold sticky left-0 bg-gray-100 z-10">Total</TableCell>
                  {MONTHS.map((m) => {
                    const val = monthlyTotals[m] ?? 0;
                    return (
                      <TableCell
                        key={m}
                        className={`text-right whitespace-nowrap text-sm font-bold ${
                          val < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {fmt$(val)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-bold whitespace-nowrap bg-yellow-100 text-green-700">
                    {fmt$(grandMonthlyTotal)}
                  </TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap bg-yellow-100 text-green-700">
                    {fmtINR(totalCurrentINR)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Partner Dialog ────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editTarget ? `Edit Partner — ${editTarget.name}` : "Add New Partner"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">

            {/* ── Section: Identity ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Identity
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="f-name">Name *</Label>
                  <Input
                    id="f-name"
                    placeholder="e.g. John Doe"
                    {...form.register("name", { required: "Name is required" })}
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-email">Email *</Label>
                  <Input
                    id="f-email"
                    type="email"
                    placeholder="john@example.com"
                    {...form.register("email", { required: "Email is required" })}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-password">
                    Password {editTarget ? "(leave blank to keep current)" : "*"}
                  </Label>
                  <Input
                    id="f-password"
                    type="password"
                    placeholder={editTarget ? "••••••••" : "Min 6 characters"}
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-mobile">Mobile</Label>
                  <Input id="f-mobile" placeholder="9876543210" {...form.register("mobile")} />
                </div>
              </div>
            </div>

            {/* ── Section: Financial ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Financial Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="f-deposit">Deposit&apos;s ($)</Label>
                  <Input
                    id="f-deposit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...form.register("deposit")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-share">Share %</Label>
                  <Input
                    id="f-share"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    {...form.register("sharePercent")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-fee">Fee %</Label>
                  <Input
                    id="f-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    {...form.register("feePercent")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-start">Start Date</Label>
                  <Input id="f-start" type="date" {...form.register("startDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-end">End Date</Label>
                  <Input id="f-end" type="date" {...form.register("endDate")} />
                </div>
              </div>
            </div>

            {/* ── Section: Accounts ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Accounts &amp; Agreements
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="f-ic">IC Market Accounts</Label>
                  <Input
                    id="f-ic"
                    placeholder="e.g. A/C - Kauser MTS 11562876"
                    {...form.register("icMarketAccount")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-agreement">Trading Agreement</Label>
                  <Input
                    id="f-agreement"
                    placeholder="e.g. Trading Agreement URL or ref"
                    {...form.register("tradingAgreement")}
                  />
                </div>
              </div>
            </div>

            {/* ── Section: Status ── */}
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="f-active"
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
              <Label htmlFor="f-active" className="cursor-pointer">
                Active — partner can log in and access their account
              </Label>
            </div>

            {/* ── Footer ── */}
            <DialogFooter className="gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {form.formState.isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                ) : editTarget ? "Update Partner" : "Create Partner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
