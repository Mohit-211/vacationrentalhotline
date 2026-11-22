"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "./PropertyDetails.module.scss";
import Header from "@/components/layout/Header";
import { IoIosArrowDown, IoMdArrowRoundBack } from "react-icons/io";
import { PiDotsThreeCircleVertical } from "react-icons/pi";
import { useParams, useRouter } from "next/navigation";
import {
  getProperty,
  deleteProperties,
} from "@/lib/api/properties";
import {
  addNote,
  getNote,
  deleteNote,
  updateNote,
} from "@/lib/api/notes";
import { Card, Dropdown, Form, Input, message, Modal, Space } from "antd";
import { Button, Container } from "react-bootstrap";
const fetchDetails = async (id, setData) => {
  try {
    const res = await getProperty(id);
    setData(res.data.data);
  } catch (e) {
    console.error(e);
  }
};
const PropertyDetails = () => {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form] = Form.useForm();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    if (id) {
      fetchDetails(id, setData);
    }
  }, [id]);
  const handleModalToggle = useCallback(
    (visible = false, noteId = null) => {
      setIsModalVisible(visible);
      setEditId(noteId);
      if (!visible) form.resetFields();
    },
    [form]
  );
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const apiCall =
        isClient && editId
          ? updateNote(editId, values)
          : addNote(id, values);
      const res = await apiCall;
      message.success(res.data.message);
      handleModalToggle(false);
      fetchDetails(id, setData);
    } catch (e) {
      console.error(e);
    }
  };
  const handleEdit = async (noteId) => {
    try {
      const res = await getNote(noteId);
      form.setFieldsValue({ notes: res.data.data.notes });
      handleModalToggle(true, noteId);
    } catch (e) {
      console.error(e);
    }
  };
  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      message.success("Note deleted successfully");
      fetchDetails(id, setData);
    } catch (e) {
      console.error(e);
    }
  };
  const handleEditProperty = () => router.push(`/addnewproperty/${id}`);
  const handleDeleteProperty = () => {
    const formData = {
      property_ids: [id],
    };
    deleteProperties(formData)
      .then((res) => {
        message.success(res?.data?.message);
        router.push("/dashboard");
      })
      .catch((e) => {
        console.log(e, "error");
      });
  };
  const renderPropertyDetails = () => (
    <Card>
      <div className={styles.detailsmain}>
        {[
          {
            label: "Property Owner Name",
            value: data?.property_owner_name ?? "---",
          },
          { label: "Address line 1", value: data?.address_line_1 ?? "---" },
          { label: "Address line 2", value: data?.address_line_2 ?? "---" },
          { label: "Status", value: data?.subscription_status ?? "---" },
          { label: "Email 1", value: data?.property_owner_email_1 ?? "---" },
          { label: "Email 2", value: data?.property_owner_email_2 ?? "---" },
          {
            label: "Phone Number 1",
            value: data?.property_owner_mobile_number_1 ?? "---",
          },
          {
            label: "Phone Number 2",
            value: data?.property_owner_mobile_number_2 ?? "---",
          },
          { label: "Country", value: data?.country ?? "---" },
          { label: "State", value: data?.state ?? "---" },
          { label: "City", value: data?.city ?? "---" },
          { label: "Zip Code", value: data?.zip_code ?? "---" },
        ]?.map((item, index) => (
          <div key={index} className={styles.item1}>
            <h6 className={styles.name}>{item.label}</h6>
            <h6 className={styles.bold}>{item.value}</h6>
          </div>
        ))}
      </div>
    </Card>
  );
  const renderSubscriptionDetails = () => (
    <Card>
      <div className={styles.subscriptionmain}>
        {[
          {
            label: "Subscription Purchased",
            value: data?.subscription_status
              ? data.subscription_status === "DEACTIVATE"
                ? "Inactive Properties"
                : "Active Properties"
              : "---",
          },
          {
            label: "Expiry Date",
            value: data?.subscription_end_date?.split("T")[0] ?? "---",
          },
          { label: "Validity", value: data?.validity ?? "---" },
        ].map((item, index) => (
          <div key={index}>
            <h6 className={styles.name}>{item.label}</h6>
            <h6 className={styles.bold}>{item.value}</h6>
          </div>
        ))}
      </div>
    </Card>
  );
  return (
    <div className={styles.PropertyDetails}>
      <Container>
        <Header />
        <div className={styles.inner}>
          <div className={styles.main}>
            <div className={styles.main_heading}>
              <IoMdArrowRoundBack
                onClick={() => router.push("/dashboard")}
                style={{ cursor: "pointer" }}
              />
              <h2>Property Details</h2>
            </div>
            <div className={styles.buttonSections}>
              <Button
                className={styles.paynow}
                onClick={() => handleModalToggle(true)}
              >
                + Add a Note
              </Button>
              <Dropdown
                menu={{
                  items: [
                    { key: "edit", label: "Edit", onClick: handleEditProperty },
                    ...(data?.payment_status !== "SUCCESS"
                      ? [
                          {
                            key: "delete",
                            label: "Delete",
                            onClick: handleDeleteProperty,
                          },
                        ]
                      : []),
                  ],
                }}
              >
                <Button className={styles.action}>
                  Action <IoIosArrowDown />
                </Button>
              </Dropdown>
            </div>
          </div>
          <div>
            {renderPropertyDetails()}
          </div>
          <div className={styles.subscriptionContainer}>
            <h6>Subscription Details</h6>
            {renderSubscriptionDetails()}
          </div>
          <div className={styles.noteContainer}>
            <h6>Notes</h6>
            {isClient &&
              data?.property_notes?.map(
                (item, index) =>
                  item?.notes && (
                    <Card key={index} className={styles.notescard}>
                      <div className={styles.mainnotes}>
                        <div>{item.notes}</div>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: "edit",
                                label: "Edit",
                                onClick: () => handleEdit(item.id),
                              },
                              {
                                key: "delete",
                                label: "Delete",
                                onClick: () => handleDeleteNote(item.id),
                              },
                            ],
                          }}
                        >
                          <Space>
                            <PiDotsThreeCircleVertical size={20} />
                          </Space>
                        </Dropdown>
                      </div>
                    </Card>
                  )
              )}
          </div>
        </div>
      </Container>
      <Modal
        title={isClient && editId ? "Edit Note" : "Add a Note"}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => handleModalToggle(false)}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="notes"
            rules={[{ required: true, message: "Please enter a note" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter your note here" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default PropertyDetails;
