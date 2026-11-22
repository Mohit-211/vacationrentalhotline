"use client";

import { Form, Input, Button, message } from "antd";
import { useState } from "react";
import { requestEmailChange } from "@/lib/api/auth";

const ChangeEmailForm = ({ onEmailChangeSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleEmailChange = async (values) => {
    const formData = {
      newEmail: values.email, // Ensure you are sending the correct key expected by your API
    };

    setLoading(true);

    try {
      const response = await requestEmailChange(formData); // Call your API to update the email
      if (response?.data?.message) {
        message.success(response.data.message || "Email updated successfully");
        onEmailChangeSuccess(); // Notify parent on success
      } else {
        message.error("Failed to update email. Please try again.");
      }
    } catch (error) {
      
      console.error("Error updating email:", error);
    } finally {
      setLoading(false); // Ensure loading state is disabled once API response is received
    }
  };

  return (
    <Form name="change_email" layout="vertical" onFinish={handleEmailChange}>
      <Form.Item
        label="New Email"
        name="email"
        rules={[
          { required: true, message: "Please input your new email!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input placeholder="Enter your new email" />
      </Form.Item>
      <Form.Item>
        <Button
          className="submit_btn_theme m-0"
          htmlType="submit"
          loading={loading}
          block
        >
          Update Email
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ChangeEmailForm;
