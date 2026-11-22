// ChangePassword.jsx
import { Form, Input, Button, message } from "antd";
import styles from "./ChangePassword.module.scss";
import { ChangePasswordApi } from "../apis/authApi";
import { removeLocalStorageItem } from "../apis/locastorageHandle";

const ChangePassword = ({ onPasswordChangeSuccess }) => {
  const handlePasswordChange = async (values) => {
    const formData = {
      old_password: values.oldpassword,
      new_password: values.password,
      confirm_password: values.confirmPassword,
    };

    try {
      const response = await ChangePasswordApi(formData);
      message.success(response?.data?.message || "Password changed successfully");
      removeLocalStorageItem();
      onPasswordChangeSuccess(); // Trigger callback on success
    } catch (error) {
      message.error(error.response?.data?.message || "Password change failed");
    }
  };

  return (
    <div className={styles.ChangePassword}>
      <div className={styles.ChangePassword_inner}>
        <Form name="change_password" layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item
            label="Old Password"
            name="oldpassword"
            rules={[{ required: true, message: "Please input your old password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please input your password!" },
              { min: 8, message: "Password must be at least 8 characters long!" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                message:
                  "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!",
              },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="*****" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("The passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="*****" />
          </Form.Item>
          <Form.Item>
            <Button className="submit_btn_theme m-0" htmlType="submit" block>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ChangePassword;
