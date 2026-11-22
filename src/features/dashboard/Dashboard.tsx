"use client";

import React, { useEffect, useState, useTransition } from "react";
import styles from "./Dashboard.module.scss";
import Header from "@/components/layout/Header";
import { Button, Container } from "react-bootstrap";
import { useRouter } from "next/navigation";
import {
  Dropdown,
  Flex,
  message,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
} from "antd";
import type { TableColumnsType } from "antd";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  deleteProperties,
  getPropertiesByType,
} from "@/lib/api/properties";
import { getTotalAmount } from "@/lib/api/payments";
import type {
  Id,
  PaymentTotal,
  Property,
  SubscriptionStatus,
} from "@/lib/api/types";

const { TabPane } = Tabs;

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
  useEffect(() => {
    handleGetProperty(true);
  }, [tabKey]);

  const handleGetProperty = async (initialLoad = false) => {
    if (initialLoad) setInitialLoading(true);
    const formData = { type: tabKey };
    try {
      const res = await getPropertiesByType(formData);
      setData(res?.data?.data);
    } catch {
      // The axios interceptor already shows an error message.
    } finally {
      setInitialLoading(false);
    }
  };

  const handleEditProperty = (id: Id) => {
    router.push(`/addnewproperty/${id}`);
  };

  const GetAmount = async (propertyId?: Id) => {
    setPayNowLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_id:
        selectedRowKeys.length === 0 ? [propertyId as Id] : selectedRowKeys,
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

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as Id[]);
  };

  const handleDeleteProperty = async (propertyId?: Id) => {
    setDeleteLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_ids:
        selectedRowKeys.length === 0 ? [propertyId as Id] : selectedRowKeys,
    };
    try {
      const res = await deleteProperties(formData);
      message.success(res?.data?.message || "Property deleted.");
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
  const columns: TableColumnsType<Property> = [
    {
      title: "Property Owner",
      dataIndex: "property_owner_name",
      key: "property_owner_name",
    },
    {
      title: "Rental Address",
      dataIndex: "full_address",
      key: "full_address",
    },
    {
      title: "",
      key: "view_detail",
      render: (_, record) => (
        <Button
          onClick={() => handleViewDetail(record.id)}
          className={styles.view_details}
          disabled={viewDetailLoading(record.id)}
        >
          {viewDetailLoading(record.id) && (
            <Spin size="small" style={{ color: "white" }} />
          )}
          View Detail
        </Button>
      ),
    },
  ];

  if (selectedRowKeys.length === 0) {
    columns.push({
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                label: "Edit",
                onClick: () => handleEditProperty(record.id),
              },
              ...(tabKey !== "ACTIVATE"
                ? [
                    {
                      key: "delete",
                      label: "Delete",
                      onClick: () => handleDeleteProperty(record.id),
                    },
                    {
                      key: "active",
                      label: "Activate",
                      onClick: () => GetAmount(record.id),
                    },
                  ]
                : []),
            ],
          }}
        >
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <BsThreeDotsVertical />
            </Space>
          </a>
        </Dropdown>
      ),
    });
  }

  const handlePaymentSuccess = () => {
    handleGetProperty(true);
  };

  return (
    <div className={styles.Dashboard}>
      {initialLoading ? (
        <Flex justify="center" align="center" style={{ height: "100vh" }}>
          <Spin size="large" />
        </Flex>
      ) : (
        <Container>
          <Header />
          <div className={styles.inner}>
            <div className={styles.main}>
              <h2>My Properties</h2>
              <div className={styles.buttonSections}>
                {tabKey !== "ACTIVATE" && (
                  <Button
                    className={styles.paynow}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => GetAmount()}
                  >
                    {payNowLoading && (
                      <Spin size="small" style={{ color: "white" }} />
                    )}
                    Pay Now
                  </Button>
                )}
                {tabKey !== "ACTIVATE" && (
                  <Button
                    className={styles.paynow}
                    onClick={() => handleDeleteProperty()}
                    disabled={selectedRowKeys.length === 0}
                  >
                    {deleteLoading && (
                      <Spin size="small" style={{ color: "white" }} />
                    )}
                    Delete
                  </Button>
                )}
                <Button
                  className={styles.add_new}
                  onClick={() => navigateTo("/addnewproperty")}
                >
                  {addNewLoading && (
                    <Spin size="small" style={{ color: "white" }} />
                  )}
                  +Add New Properties
                </Button>
              </div>
            </div>
            <div className={styles.propertyTable}>
              <Tabs
                defaultActiveKey={tabKey}
                onChange={(key) => {
                  setTabKey(key as SubscriptionStatus);
                  setSelectedRowKeys([]); // Clear selected rows
                }}
              >
                <TabPane tab="Inactive Properties" key="DEACTIVATE">
                  <span style={{ marginLeft: 8 }}>
                    {selectedRowKeys.length
                      ? `Selected ${selectedRowKeys.length} items`
                      : ""}
                  </span>

                  <Table
                    rowSelection={{
                      selectedRowKeys,
                      onChange: onSelectChange,
                    }}
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                  />
                </TabPane>
                <TabPane tab="Active Properties" key="ACTIVATE">
                  <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                  />
                </TabPane>
              </Tabs>
              <Modal
                open={showModal}
                onCancel={handleCloseModal}
                footer={null}
              >
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    amount={Number(propertyAmount?.totalAmount) * 100}
                    currency="USD"
                    property_id={
                      selectedRowKeys.length === 0
                        ? [propertyId as Id]
                        : selectedRowKeys
                    }
                    description="Purchase"
                    onCloseModal={handleCloseModal}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </Modal>
            </div>
          </div>
        </Container>
      )}
    </div>
  );
};

export default Dashboard;
