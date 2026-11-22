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
  const [initialLoading, setInitialLoading] = useState(true);
  const [data, setData] = useState<Property[]>([]);
  const [showModal, setShowModal] = useState(false);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Id[]>([]);
  const [propertyId, setPropertyId] = useState<Id>();
  const [propertyAmount, setPropertyAmount] = useState<PaymentTotal>();
  const [tabKey, setTabKey] = useState<SubscriptionStatus>("DEACTIVATE");

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
  const addNewLoading = isNavigatingTo("/addnewproperty");
  const viewDetailLoading = (id: Id) => isNavigatingTo(`/property-detail/${id}`);

  const fetchProperties = (type: SubscriptionStatus) => {
    getPropertiesByType({ type })
      .then((res) => {
        setData(res?.data?.data);
      })
      .catch(() => {
        // The axios interceptor already shows an error message.
      })
      .finally(() => {
        setInitialLoading(false);
      });
  };

  const handleGetProperty = (initialLoad = false) => {
    if (initialLoad) setInitialLoading(true);
    fetchProperties(tabKey);
  };

  useEffect(() => {
    fetchProperties(tabKey);
  }, [tabKey]);

  const handleEditProperty = (id: Id) => {
    router.push(`/addnewproperty/${id}`);
  };

  const GetAmount = async (propertyId?: Id) => {
    setPayNowLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_id: selectedRowKeys.length === 0 ? [propertyId as Id] : selectedRowKeys,
    };
    try {
      const res = await getTotalAmount(formData);
      setPropertyAmount(res?.data?.data);
      handlePurchaseClick();
    } catch (error) {
      console.log(error);
    } finally {
      setPayNowLoading(false);
    }
  };

  const handlePurchaseClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDeleteProperty = async (propertyId?: Id) => {
    setDeleteLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_ids: selectedRowKeys.length === 0 ? [propertyId as Id] : selectedRowKeys,
    };
    try {
      const res = await deleteProperties(formData);
      toast.success(res?.data?.message || "Property deleted.");
      handleGetProperty(true);
    } catch (error) {
      console.log(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetail = (id: Id) => {
    navigateTo(`/property-detail/${id}`);
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
    ...(selectedRowKeys.length === 0
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
                  {tabKey !== "ACTIVATE" && (
                    <>
                      <DropdownMenuItem variant="danger" onSelect={() => handleDeleteProperty(row.original.id)}>
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => GetAmount(row.original.id)}>Activate</DropdownMenuItem>
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
    handleGetProperty(true);
  };

  const empty = (
    <EmptyState
      icon={<Building2 aria-hidden="true" />}
      title={tabKey === "ACTIVATE" ? "No active properties" : "No inactive properties"}
      description={
        tabKey === "ACTIVATE"
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
            {tabKey !== "ACTIVATE" && (
              <Button variant="secondary" disabled={selectedRowKeys.length === 0} onClick={() => GetAmount()}>
                {payNowLoading && <Spinner label="Loading amount" />}
                Pay Now
              </Button>
            )}
            {tabKey !== "ACTIVATE" && (
              <Button
                variant="outline"
                className="text-danger"
                onClick={() => handleDeleteProperty()}
                disabled={selectedRowKeys.length === 0}
              >
                {deleteLoading && <Spinner label="Deleting" />}
                Delete
              </Button>
            )}
            <Button onClick={() => navigateTo("/addnewproperty")}>
              {addNewLoading ? <Spinner label="Opening" /> : <Plus aria-hidden="true" />}
              Add New Properties
            </Button>
          </>
        }
      />
      <Tabs
        value={tabKey}
        onValueChange={(key) => {
          setTabKey(key as SubscriptionStatus);
          setSelectedRowKeys([]); // Clear selected rows
          setInitialLoading(true);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="DEACTIVATE">Inactive Properties</TabsTrigger>
          <TabsTrigger value="ACTIVATE">Active Properties</TabsTrigger>
        </TabsList>
        <TabsContent value="DEACTIVATE" className="space-y-3">
          <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {selectedRowKeys.length ? `Selected ${selectedRowKeys.length} items` : ""}
          </p>
          <DataTable
            aria-label="Inactive properties"
            columns={columns}
            data={data}
            getRowId={(row) => row.id}
            selectedIds={selectedRowKeys}
            onSelectedIdsChange={setSelectedRowKeys}
            loading={initialLoading}
            empty={empty}
          />
        </TabsContent>
        <TabsContent value="ACTIVATE">
          <DataTable
            aria-label="Active properties"
            columns={columns}
            data={data}
            getRowId={(row) => row.id}
            loading={initialLoading}
            empty={empty}
          />
        </TabsContent>
      </Tabs>
      <Dialog open={showModal} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
            <DialogDescription>Enter your card details to activate the selected properties.</DialogDescription>
          </DialogHeader>
          <Elements stripe={stripePromise}>
            <CheckoutForm
              amount={Number(propertyAmount?.totalAmount) * 100}
              currency="USD"
              property_id={selectedRowKeys.length === 0 ? [propertyId as Id] : selectedRowKeys}
              description="Purchase"
              onCloseModal={handleCloseModal}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
