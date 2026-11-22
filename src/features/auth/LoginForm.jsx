"use client";

import { Button, Form, Input, message } from "antd";
import React, { useState } from "react";
import styles from "./LoginForm.module.scss";
import { useRouter } from "next/navigation";
import { IoMdArrowRoundBack } from "react-icons/io";
import Logo from "@public/logo-2.png";
import Image from "next/image";
import { login } from "@/lib/api/auth";
import secureLocalStorage from "react-secure-storage";

const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await login(values);
      message.success(response?.data?.message);
      if (response.status === 200) {
        const token = response?.data?.data?.tokens?.access?.token;
        secureLocalStorage.removeItem("usertoken");
        secureLocalStorage.setItem("usertoken", token);
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Login failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <h4>Login</h4>
        <div className={styles?.bottomText}>
          Don't have an account?{" "}
          <span
            onClick={() => {
              router.push("/signup");
            }}
            style={{ cursor: "pointer", color: "blue" }}
          >
            Sign up
          </span>
        </div>

        <Form name="loginForm" onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please input your Email!",
              },
            ]}
          >
            <Input placeholder="Enter Email Address" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password placeholder="*****" />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              className="submit_btn_theme"
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>

          <div
            style={{ cursor: "pointer", marginBottom: "20px" }}
            className={styles?.bottomText}
            onClick={() => {
              router.push("/forgot-password");
            }}
          >
            Forgot Password
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
