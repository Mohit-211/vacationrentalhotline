"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Building2, EllipsisVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, dataTableColumns } from "@/components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
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
import { cancelRenewal, quoteCheckout } from "@/lib/api/checkout";
import { deleteProperties, listProperties } from "@/lib/api/properties";
import type { Property, PropertyStatus, Quote } from "@/lib/api/types";
import CheckoutForm from "./CheckoutForm";

const column = dataTableColumns<Property>();

/** "Renews Nov 22, 2027" or "Ends Nov 22, 2027". */
export const coverLabel = (property: Pick<Property, "subscriptionEndsAt" | "autoRenews">) => {
  if (!property.subscriptionEndsAt) return "—";
  const date = new Date(property.subscriptionEndsAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${property.autoRenews ? "Renews" : "Ends"} ${date}`;
};

const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Property[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<{ propertyIds: string[]; quote: Quote }>();
  const [status, setStatus] = useState<PropertyStatus>("inactive");
  const [renewalToCancel, setRenewalToCancel] = useState<Property>();
  const [cancelLoading, setCancelLoading] = useState(false);

  // Button loading states
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // router.push() returns nothing in the App Router, so pending navigations
  // are tracked with a transition instead of a Promise.
  const [isNavigating, startNavigation] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const navigateTo = (path: string) => {
    setNavigatingTo(path);
    startNavigation(() => router.push(path));
  };
  const isNavigatingTo = (path: string) => isNavigating && navigatingTo === path;
  const addNewLoading = isNavigatingTo("/properties/new");
  const viewDetailLoading = (id: string) => isNavigatingTo(`/properties/${id}`);

  const fetchProperties = (type: PropertyStatus) => {
    listProperties(type)
      .then((res) => {
        setData(res.data.data);
      })
      .catch(() => {
        // The axios interceptor already shows an error message.
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const reloadProperties = (initialLoad = false) => {
    if (initialLoad) setLoading(true);
    fetchProperties(status);
  };

  useEffect(() => {
    fetchProperties(status);
  }, [status]);

  const handleEditProperty = (id: string) => {
    router.push(`/properties/${id}/edit`);
  };

  const startPayment = async (propertyId?: string) => {
    setPayNowLoading(true);
    const propertyIds = selectedIds.length === 0 ? [propertyId as string] : selectedIds;
    try {
      // The server prices the checkout; the card form shows that amount.
      const res = await quoteCheckout(propertyIds);
      setCheckout({ propertyIds, quote: res.data.data });
      openCheckout();
    } catch {
      // The API client has already shown the error (e.g. too many to buy online).
    } finally {
      setPayNowLoading(false);
    }
  };

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

  const openCheckout = () => {
    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
  };

  const handleDeleteProperty = async (propertyId?: string) => {
    setDeleteLoading(true);
    const ids = selectedIds.length === 0 ? [propertyId as string] : selectedIds;
    try {
      const res = await deleteProperties(ids);
      const { deleted } = res.data.data;
      toast.success(deleted === 1 ? "Property deleted." : `${deleted} properties deleted.`);
      setSelectedIds([]);
      reloadProperties(true);
    } catch {
      // The API client has already shown the error.
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetail = (id: string) => {
    navigateTo(`/properties/${id}`);
  };

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetail(row.original.id)}
          disabled={viewDetailLoading(row.original.id)}
        >
          {viewDetailLoading(row.original.id) && <Spinner label="Opening" />}
          View Detail
        </Button>
      ),
    }),
    ...(selectedIds.length === 0
      ? [
          column.display({
            id: "action",
            header: "Action",
            cell: ({ row }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${row.original.ownerName}`}
                  >
                    <EllipsisVertical aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => handleEditProperty(row.original.id)}>Edit</DropdownMenuItem>
                  {status !== "active" && (
                    <>
                      <DropdownMenuItem variant="danger" onSelect={() => handleDeleteProperty(row.original.id)}>
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => startPayment(row.original.id)}>Activate</DropdownMenuItem>
                    </>
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

  const handlePaymentSuccess = () => {
    reloadProperties(true);
  };

  const empty = (
    <EmptyState
      icon={<Building2 aria-hidden="true" />}
      title={status === "active" ? "No active properties" : "No inactive properties"}
      description={
        status === "active"
          ? "Properties appear here once their subscription is paid."
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
            {status !== "active" && (
              <Button variant="secondary" disabled={selectedIds.length === 0} onClick={() => startPayment()}>
                {payNowLoading && <Spinner label="Loading amount" />}
                Pay Now
              </Button>
            )}
            {status !== "active" && (
              <Button
                variant="outline"
                className="text-danger"
                onClick={() => handleDeleteProperty()}
                disabled={selectedIds.length === 0}
              >
                {deleteLoading && <Spinner label="Deleting" />}
                Delete
              </Button>
            )}
            <Button onClick={() => navigateTo("/properties/new")}>
              {addNewLoading ? <Spinner label="Opening" /> : <Plus aria-hidden="true" />}
              Add New Properties
            </Button>
          </>
        }
      />
      <Tabs
        value={status}
        onValueChange={(key) => {
          setStatus(key as PropertyStatus);
          setSelectedIds([]); // Clear selected rows
          setLoading(true);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="inactive">Inactive Properties</TabsTrigger>
          <TabsTrigger value="active">Active Properties</TabsTrigger>
        </TabsList>
        <TabsContent value="inactive" className="space-y-3">
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
      <Dialog open={checkoutOpen} onOpenChange={(open) => !open && closeCheckout()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
            <DialogDescription>Enter your card details to activate the selected properties.</DialogDescription>
          </DialogHeader>
          {checkout && (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                propertyIds={checkout.propertyIds}
                quote={checkout.quote}
                onCloseModal={closeCheckout}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
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
