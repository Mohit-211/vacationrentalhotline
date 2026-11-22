import React, { useState } from "react";
import { Button, Form, Input, message, Spin } from "antd";
import styles from "./ForgotPassword.module.scss";
import { useRouter, useSearchParams } from "next/navigation";
import { ForgotPasswordApi } from "../apis/authApi";
import Logo from "../../public/assests/Logo.png";
import Image from "next/image";
import { IoMdArrowRoundBack } from "react-icons/io";

const ForgotPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Retrieve token from query
  const [loading, setLoading] = useState(false); // State for loading spinner

  // Handle the password change process
  const handlePasswordChange = async (values) => {
    setLoading(true); // Start loading spinner
    const formData = {
      password: values.password,
      confirm_password: values.confirmPassword,
      token: token, // Include the token in the request
    };

    try {
      await ForgotPasswordApi(formData);
      message.success("Password changed successfully!");
      router.replace("/login"); // Redirect to login page after successful change
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <div className={styles.ForgotPassword}>
      <div className={styles.Login}>
        <div className={styles.Login_inner}>
        <div className="main_heading">
          <div
            onClick={() => {
              router.push("/");
            }}
            style={{ cursor: "pointer" }}
          >
            <Image src={Logo} height={50} alt="Logo" />
          </div>
          <div
            className="innerheading"
            onClick={() => {
              router.push("/");
            }}
            style={{ cursor: "pointer" }}
          >
            <IoMdArrowRoundBack />
            <div>Go to Home</div>
          </div>
        </div>
          <h4>Forgot Password</h4>

          <Spin size="small" style={{ color: "white" }} spinning={loading}>
            <Form
              name="reset"
              autoComplete="off"
              layout="vertical"
              onFinish={handlePasswordChange} // Form submission handler
            >
              <Form.Item
                label="New Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please input your new password!",
                  },
                  {
                    min: 8,
                    message: "Password must be at least 8 characters long!",
                  },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!",
                  },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your new password!",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match!")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item>
                <Button
                  className="submit_btn_theme"
                  htmlType="submit"
                  block
                  loading={loading} // Show spinner when loading is true
                >
                  {loading ? "Changing Password..." : "Change Password"}
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
