"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { Building2, CircleAlert, EllipsisVertical, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, dataTableColumns } from "@/components/ui/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { CheckoutDialog, useCheckout } from "@/features/checkout/CheckoutDialog";
import { getAccount } from "@/lib/api/account";
import { cancelRenewal } from "@/lib/api/checkout";
import { deleteProperties, listProperties } from "@/lib/api/properties";
import type { Account, Property, PropertyStatus } from "@/lib/api/types";
import { formatPrice, PRICING } from "@/lib/pricing";
import { formatDate } from "@/lib/dates";

const column = dataTableColumns<Property>();

/** "Free cover", "Renews 11/22/2027" or "Ends 11/22/2027". */
export const coverLabel = (property: Pick<Property, "subscriptionEndsAt" | "autoRenews" | "complimentary">) => {
  if (property.complimentary) return "Free cover";
  if (!property.subscriptionEndsAt) return "—";
  return `${property.autoRenews ? "Renews" : "Ends"} ${formatDate(property.subscriptionEndsAt)}`;
};

/** What cover costs, from the same price list checkout charges. */
export const priceSummary = () =>
  `Cover costs ${formatPrice(PRICING.singlePropertyCents)} a year for one property, or ${formatPrice(PRICING.multiPropertyCents)} a year each for 2 to ${PRICING.maxPropertiesOnline}.`;

/** A spinner while the enclosing link's page loads (only if it wasn't prefetched); `idle` otherwise. */
function LinkPending({ idle = null }: { idle?: ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner label="Opening" /> : idle;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Property[]>([]);
  const [account, setAccount] = useState<Account>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<PropertyStatus>("inactive");
  const [renewalToCancel, setRenewalToCancel] = useState<Property>();
  const [cancelLoading, setCancelLoading] = useState(false);
  // Properties waiting for the user to confirm their deletion.
  const [toDelete, setToDelete] = useState<string[]>();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const freeCover = account?.freeCover ?? null;
  const atFreeCoverLimit = freeCover !== null && freeCover.used >= freeCover.properties;

  const fetchProperties = useCallback((type: PropertyStatus) => {
    listProperties(type)
      .then((res) => setData(res.data.data))
      .catch(() => {
        // The API client has already shown the error.
      })
      .finally(() => setLoading(false));
    getAccount()
      .then((res) => setAccount(res.data.data))
      .catch(() => undefined);
  }, []);

  const reloadProperties = (showLoading = false) => {
    if (showLoading) setLoading(true);
    fetchProperties(status);
  };

  useEffect(() => {
    fetchProperties(status);
  }, [fetchProperties, status]);

  const checkout = useCheckout(() => {
    setSelectedIds([]);
    reloadProperties(true);
  });

  const confirmCancelRenewal = async () => {
    if (!renewalToCancel) return;
    setCancelLoading(true);
    try {
      await cancelRenewal(renewalToCancel.id);
      toast.success("Renewal cancelled. The property stays covered until its paid year ends.");
      setRenewalToCancel(undefined);
      reloadProperties();
    } catch {
      // The API client has already shown the error.
    } finally {
      setCancelLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleteLoading(true);
    try {
      const res = await deleteProperties(toDelete);
      const { deleted } = res.data.data;
      toast.success(deleted === 1 ? "Property deleted." : `${deleted} properties deleted.`);
      setToDelete(undefined);
      setSelectedIds([]);
      reloadProperties(true);
    } catch {
      // The API client has already shown the error.
    } finally {
      setDeleteLoading(false);
    }
  };

  const canPay = status === "inactive" && freeCover === null;

  const columns = column.columns([
    column.accessor("ownerName", {
      header: "Property Owner",
      cell: ({ getValue, row }) => (
        <div>
          <span className="font-semibold">{getValue()}</span>
          {/* Small screens show the address here instead of in its own column. */}
          <p className="mt-0.5 text-muted-foreground sm:hidden">{row.original.fullAddress}</p>
        </div>
      ),
    }),
    column.accessor("fullAddress", {
      header: "Rental Address",
      meta: { className: "hidden sm:table-cell" },
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
    }),
    ...(status === "active"
      ? [
          column.display({
            id: "cover",
            header: "Cover",
            meta: { className: "hidden md:table-cell" },
            cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{coverLabel(row.original)}</span>,
          }),
        ]
      : []),
    column.display({
      id: "view_detail",
      header: () => <span className="sr-only">Details</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {canPay && selectedIds.length === 0 && (
            <Button
              variant="secondary"
              size="sm"
              disabled={checkout.starting}
              onClick={() => checkout.start([row.original.id])}
            >
              Activate
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/properties/${row.original.id}`}>
              <LinkPending />
              View Detail
            </Link>
          </Button>
        </div>
      ),
    }),
    ...(selectedIds.length === 0
      ? [
          column.display({
            id: "action",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.ownerName}`}>
                    <EllipsisVertical aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href={`/properties/${row.original.id}/edit`}>Edit</Link>
                  </DropdownMenuItem>
                  {row.original.canDelete && (
                    <DropdownMenuItem variant="danger" onSelect={() => setToDelete([row.original.id])}>
                      Delete
                    </DropdownMenuItem>
                  )}
                  {status === "active" && row.original.autoRenews && (
                    <DropdownMenuItem variant="danger" onSelect={() => setRenewalToCancel(row.original)}>
                      Cancel renewal
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          }),
        ]
      : []),
  ]);

  const empty = (
    <EmptyState
      icon={<Building2 aria-hidden="true" />}
      title={status === "active" ? "No active properties" : "No inactive properties"}
      description={
        status === "active"
          ? "Properties appear here once their cover starts."
          : freeCover
            ? "Your properties are covered free of charge, so they're all in Active Properties."
            : "Add a property to get started."
      }
    />
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Properties"
        actions={
          <>
            {canPay && (
              <Button
                variant="secondary"
                disabled={selectedIds.length === 0}
                onClick={() => checkout.start(selectedIds)}
              >
                {checkout.starting && <Spinner label="Loading amount" />}
                Pay Now
              </Button>
            )}
            {status !== "active" && (
              <Button
                variant="outline"
                className="text-danger"
                onClick={() => setToDelete(selectedIds)}
                disabled={selectedIds.length === 0}
              >
                Delete
              </Button>
            )}
            {atFreeCoverLimit ? (
              // At the free cover limit there's nothing to add, so it isn't a link.
              <Button disabled>
                <Plus aria-hidden="true" />
                Add New Properties
              </Button>
            ) : (
              <Button asChild>
                <Link href="/properties/new">
                  <LinkPending idle={<Plus aria-hidden="true" />} />
                  Add New Properties
                </Link>
              </Button>
            )}
          </>
        }
      />

      {freeCover && (
        <Alert variant="success">
          <ShieldCheck aria-hidden="true" />
          <div>
            <p className="font-semibold">Free cover</p>
            <p>
              Your account includes free hotline cover for up to {freeCover.properties}{" "}
              {freeCover.properties === 1 ? "property" : "properties"} ({freeCover.used} added). There&apos;s nothing to
              pay.{atFreeCoverLimit && " To add more, please contact us."}
            </p>
          </div>
        </Alert>
      )}

      <Tabs
        value={status}
        onValueChange={(key) => {
          setStatus(key as PropertyStatus);
          setSelectedIds([]);
          setLoading(true);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="inactive">Inactive Properties</TabsTrigger>
          <TabsTrigger value="active">Active Properties</TabsTrigger>
        </TabsList>
        <TabsContent value="inactive" className="space-y-3">
          {canPay && !loading && data.length > 0 && (
            <Alert variant="info">
              <CircleAlert aria-hidden="true" />
              <div>
                <p className="font-semibold">Not covered yet</p>
                <p>
                  We don&apos;t answer calls for these properties until they&apos;re activated. {priceSummary()} Activate
                  one, or select several and choose Pay Now.
                </p>
              </div>
            </Alert>
          )}
          <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {selectedIds.length ? `Selected ${selectedIds.length} items` : ""}
          </p>
          <DataTable
            aria-label="Inactive properties"
            columns={columns}
            data={data}
            getRowId={(row) => row.id}
            selectedIds={selectedIds}
            onSelectedIdsChange={(ids) => setSelectedIds(ids.map(String))}
            loading={loading}
            empty={empty}
          />
        </TabsContent>
        <TabsContent value="active">
          <DataTable
            aria-label="Active properties"
            columns={columns}
            data={data}
            getRowId={(row) => row.id}
            loading={loading}
            empty={empty}
          />
        </TabsContent>
      </Tabs>

      <CheckoutDialog {...checkout.dialog} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(undefined)}
        title={toDelete && toDelete.length > 1 ? `Delete ${toDelete.length} properties?` : "Delete this property?"}
        description={
          toDelete?.length === 1
            ? `${data.find((p) => p.id === toDelete[0])?.fullAddress ?? "This property"} and its notes will be deleted. This can't be undone.`
            : `These ${toDelete?.length ?? 0} properties and their notes will be deleted. This can't be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={Boolean(renewalToCancel)}
        onOpenChange={(open) => !open && setRenewalToCancel(undefined)}
        title="Cancel renewal?"
        description={
          renewalToCancel
            ? `${renewalToCancel.fullAddress} stays covered until its paid year ends (${coverLabel(renewalToCancel).replace("Renews ", "")}), then stops. You won't be charged again for it.`
            : ""
        }
        confirmLabel="Cancel renewal"
        cancelLabel="Keep renewing"
        variant="danger"
        loading={cancelLoading}
        onConfirm={confirmCancelRenewal}
      />
    </div>
  );
};

export default Dashboard;
