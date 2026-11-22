import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.scss";
import HeadersSection from "@/components/HeadersSection/HeadersSection";
import { Button, Container } from "react-bootstrap";
import { useRouter } from "next/router";
import {
  Dropdown,
  Flex,
  Menu,
  message,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
} from "antd";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "@/components/CheckoutForm/CheckoutForm";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DeletePropertyApi,
  GetPropertyApi,
} from "@/components/apis/propertyApi";
import { GetAmountTotal } from "@/components/apis/payment";

const { TabPane } = Tabs;

const Dashboard = () => {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [propertyId, setPropertyId] = useState();
  const [propertyAmount, setPropertyAmount] = useState();
  const [tabKey, setTabKey] = useState("DEACTIVATE");

  // Button loading states
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addNewLoading, setAddNewLoading] = useState(false);
  const [viewDetailLoading, setViewDetailLoading] = useState({});
  useEffect(() => {
    handleGetProperty(true);
  }, [tabKey]);

  const handleGetProperty = async (initialLoad = false) => {
    if (initialLoad) setInitialLoading(true);
    const formData = { type: tabKey };
    try {
      const res = await GetPropertyApi(formData);
      setData(res?.data?.data);
    } catch {
      // The axios interceptor already shows an error message.
    } finally {
      setInitialLoading(false);
    }
  };

  const handleEditProperty = (id) => {
    router.push(`/addnewproperty/${id}`);
  };

  const GetAmount = async (propertyId) => {
    setPayNowLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_id:
        selectedRowKeys.length === 0 ? [propertyId] : selectedRowKeys,
    };
    try {
      const res = await GetAmountTotal(formData);
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

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleDeleteProperty = async (propertyId) => {
    setDeleteLoading(true);
    setPropertyId(propertyId);
    const formData = {
      property_ids:
        selectedRowKeys.length === 0 ? [propertyId] : selectedRowKeys,
    };
    try {
      const res = await DeletePropertyApi(formData);
      message.success(res?.data?.message || "Property deleted.");
      handleGetProperty(true);
    } catch (error) {
      console.log(error);
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleViewDetail = (id) => {
    setViewDetailLoading((prevState) => ({ ...prevState, [id]: true }));
    router.push(`/property-detail/${id}`).finally(() => {
      setViewDetailLoading((prevState) => ({ ...prevState, [id]: false }));
    });
  };
  const columns = [
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
      render: (text, record) => (
        <Button
          onClick={() => handleViewDetail(record.id)}
          className={styles.view_details}
          disabled={viewDetailLoading[record.id]}
        >
          {viewDetailLoading[record.id] && (
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
      render: (text, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="edit"
                onClick={() => handleEditProperty(record.id)}
              >
                Edit
              </Menu.Item>
              {tabKey !== "ACTIVATE" && (
                <>
                  <Menu.Item
                    key="delete"
                    onClick={() => handleDeleteProperty(record.id)}
                  >
                    Delete
                  </Menu.Item>
                  <Menu.Item key="active" onClick={() => GetAmount(record.id)}>
                    Activate
                  </Menu.Item>
                </>
              )}
            </Menu>
          }
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
          <HeadersSection />
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
                    loading={deleteLoading}
                  >
                    {deleteLoading && (
                      <Spin size="small" style={{ color: "white" }} />
                    )}
                    Delete
                  </Button>
                )}
                <Button
                  className={styles.add_new}
                  onClick={() => {
                    setAddNewLoading(true);
                    router
                      .push("/addnewproperty")
                      .finally(() => setAddNewLoading(false));
                  }}
                  loading={addNewLoading}
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
                  setTabKey(key);
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
                visible={showModal}
                onCancel={handleCloseModal}
                footer={null}
              >
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    amount={propertyAmount?.totalAmount * 100}
                    currency="USD"
                    property_id={
                      selectedRowKeys.length === 0
                        ? [propertyId]
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
