"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Building2, EllipsisVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
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
import { deleteProperties, getPropertiesByType } from "@/lib/api/properties";
import { getTotalAmount } from "@/lib/api/payments";
import type { Id, PaymentTotal, Property, SubscriptionStatus } from "@/lib/api/types";
import CheckoutForm from "./CheckoutForm";

const column = dataTableColumns<Property>();

const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Property[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);
  const [selectedIds, setSelectedIds] = useState<Id[]>([]);
  const [propertyId, setPropertyId] = useState<Id>();
  const [paymentTotal, setPaymentTotal] = useState<PaymentTotal>();
  const [status, setStatus] = useState<SubscriptionStatus>("DEACTIVATE");

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
  const viewDetailLoading = (id: Id) => isNavigatingTo(`/properties/${id}`);

  const fetchProperties = (type: SubscriptionStatus) => {
    getPropertiesByType({ type })
      .then((res) => {
        setData(res?.data?.data);
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

  const handleEditProperty = (id: Id) => {
    router.push(`/properties/${id}/edit`);
  };

  const startPayment = async (propertyId?: Id) => {
    setPayNowLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_id: selectedIds.length === 0 ? [propertyId as Id] : selectedIds,
    };
    try {
      const res = await getTotalAmount(formData);
      setPaymentTotal(res?.data?.data);
      openCheckout();
    } catch (error) {
      console.log(error);
    } finally {
      setPayNowLoading(false);
    }
  };

  const openCheckout = () => {
    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
  };

  const handleDeleteProperty = async (propertyId?: Id) => {
    setDeleteLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_ids: selectedIds.length === 0 ? [propertyId as Id] : selectedIds,
    };
    try {
      const res = await deleteProperties(formData);
      toast.success(res?.data?.message || "Property deleted.");
      reloadProperties(true);
    } catch (error) {
      console.log(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetail = (id: Id) => {
    navigateTo(`/properties/${id}`);
  };

  const columns = column.columns([
    column.accessor("property_owner_name", {
      header: "Property Owner",
      cell: ({ getValue, row }) => (
        <div>
          <span className="font-semibold">{getValue()}</span>
          {/* Small screens show the address here instead of in its own column. */}
          <p className="mt-0.5 text-muted-foreground sm:hidden">{row.original.full_address}</p>
        </div>
      ),
    }),
    column.accessor("full_address", {
      header: "Rental Address",
      meta: { className: "hidden sm:table-cell" },
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
    }),
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
                    aria-label={`Actions for ${row.original.property_owner_name ?? "property"}`}
                  >
                    <EllipsisVertical aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => handleEditProperty(row.original.id)}>Edit</DropdownMenuItem>
                  {status !== "ACTIVATE" && (
                    <>
                      <DropdownMenuItem variant="danger" onSelect={() => handleDeleteProperty(row.original.id)}>
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => startPayment(row.original.id)}>Activate</DropdownMenuItem>
                    </>
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
      title={status === "ACTIVATE" ? "No active properties" : "No inactive properties"}
      description={
        status === "ACTIVATE"
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
            {status !== "ACTIVATE" && (
              <Button variant="secondary" disabled={selectedIds.length === 0} onClick={() => startPayment()}>
                {payNowLoading && <Spinner label="Loading amount" />}
                Pay Now
              </Button>
            )}
            {status !== "ACTIVATE" && (
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
          setStatus(key as SubscriptionStatus);
          setSelectedIds([]); // Clear selected rows
          setLoading(true);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="DEACTIVATE">Inactive Properties</TabsTrigger>
          <TabsTrigger value="ACTIVATE">Active Properties</TabsTrigger>
        </TabsList>
        <TabsContent value="DEACTIVATE" className="space-y-3">
          <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {selectedIds.length ? `Selected ${selectedIds.length} items` : ""}
          </p>
          <DataTable
            aria-label="Inactive properties"
            columns={columns}
            data={data}
            getRowId={(row) => row.id}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            loading={loading}
            empty={empty}
          />
        </TabsContent>
        <TabsContent value="ACTIVATE">
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
          <Elements stripe={stripePromise}>
            <CheckoutForm
              amount={Number(paymentTotal?.totalAmount) * 100}
              currency="USD"
              property_id={selectedIds.length === 0 ? [propertyId as Id] : selectedIds}
              description="Purchase"
              onCloseModal={closeCheckout}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
