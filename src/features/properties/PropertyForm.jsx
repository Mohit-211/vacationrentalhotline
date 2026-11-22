"use client";

import React, { useEffect, useState } from "react";
import styles from "./PropertyForm.module.scss";
import { Container } from "react-bootstrap";
import { DeleteOutlined } from "@ant-design/icons";
import Header from "@/components/layout/Header";
import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Space,
  Spin,
  Switch,
  Select,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import CsvImport from "@/features/properties/csv-import/CsvImport";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { IoMdArrowRoundBack } from "react-icons/io";
import {
  getCountries,
  getStates,
  getCities,
} from "@/lib/api/locations";
import {
  createProperties,
  updateProperty,
} from "@/lib/api/properties";
const { Option } = Select;
const PropertyForm = ({ propertyData }) => {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [properties, setProperties] = useState(
    propertyData ? [propertyData] : [{}]
  );
  const [isCsvMode, setIsCsvMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [form] = Form.useForm();
  const addPropertyForm = () => {
    setProperties([...properties, {}]);
  };
  const removeProperty = (indexToRemove) => {
    if (properties.length > 1) {
      const updatedProperties = properties.filter(
        (_, index) => index !== indexToRemove
      );
      setProperties(updatedProperties);

      // Update form fields after removal
      const currentFormValues = form.getFieldsValue();
      const updatedFormValues = {
        properties: currentFormValues.properties.filter(
          (_, index) => index !== indexToRemove
        ),
      };
      form.setFieldsValue(updatedFormValues);
    } else {
      message.warning("At least one property is required");
    }
  };
  const onFinish = (values) => {
    const allValues = form.getFieldsValue();
    allValues.properties.forEach((property, index) => {
      property.country = countries.find((c) => c.id === selectedCountry)?.name;
      property.state = states.find((s) => s.id === selectedState)?.name;
      property.city = cities.find((c) => c.id === selectedCity)?.name;
    });
    setButtonLoading(true);
    const apiCall = propertyData
      ? updateProperty(propertyData.id, values.properties[0])
      : createProperties(allValues);
    apiCall
      .then((res) => {
        message.success(res?.data?.message);
        form.resetFields();
        router.push("/dashboard");
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setButtonLoading(false);
      });
  };
  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };
  const handleSaveDetails = () => {
    form.submit();
  };
  useEffect(() => {
    if (propertyData) {
      form.setFieldsValue({ properties: [propertyData] });
      setLoading(false);
    }
  }, [propertyData]);
  useEffect(() => {
    setIsClient(true);
    setLoading(false);
  }, []);
  useEffect(() => {
    getCountries()
      .then((res) => {
        const allCountries = res?.data?.data || [];
        const filteredCountries = allCountries.filter(
          (country) =>
            country.name === "United States" || country.name === "Canada"
        );
        setCountries(filteredCountries);
      })
      .catch((e) => {
        console.log(e, "error");
      });
  }, []);
  const handleCountryChange = (value) => {
    setSelectedCountry(value);
    form.setFieldsValue({ state: null, city: null });
    getStates(value)
      .then((res) => {
        setStates(res?.data?.data[0]?.all_state || []);
        setCities([]);
        setSelectedState(null);
        setSelectedCity(null);
      })
      .catch((e) => {
        console.log(e, "error");
      });
  };
  const handleStateChange = (value) => {
    setSelectedState(value);
    form.setFieldsValue({ city: null });
    getCities(value)
      .then((res) => {
        setCities(res?.data?.data || []);
        setSelectedCity(null);
      })
      .catch((e) => {
        console.log(e, "error");
      });
  };
  const validatePhoneNumber1 = (rule, value) => {
    if (!value) {
      return Promise.reject("Phone number is required.");
    }
    return validatePhoneNumber(value);
  };
  const validatePhoneNumber2 = (rule, value) => {
    if (!value) {
      return Promise.resolve();
    }
    return validatePhoneNumber(value);
  };
  const validatePhoneNumber = (value) => {
    const phoneNumber = parsePhoneNumberFromString(value);
    if (phoneNumber && phoneNumber.isValid()) {
      return Promise.resolve();
    }
    return Promise.reject("Invalid phone number.");
  };
  return (
    <>
      {!isClient || loading ? (
        <Flex justify="center" align="center" style={{ height: "100vh" }}>
          <Spin size="large" />
        </Flex>
      ) : (
        <>
          <div className={`${styles.AddNewProperty} AddNewProperty`}>
            <Container>
              <Header />
              <div className={styles.switchSection}>
                <span style={{ color: "black" }}>
                  Switch to CSV Upload:&nbsp;&nbsp;
                </span>
                <Switch
                  checked={isCsvMode}
                  onChange={(checked) => setIsCsvMode(checked)}
                />
              </div>
              <div className={styles.main}>
                <div className={styles?.main_heading}>
                  <IoMdArrowRoundBack
                    onClick={() => router.push("/dashboard")}
                    style={{ cursor: "pointer", color: "black" }}
                  />
                  <h2>{id ? "Update Property" : "Add New Property"}</h2>
                </div>
                <div className={styles.buttonSections}>
                  {!isCsvMode && (
                    <Button
                      className={styles.add_new}
                      onClick={handleSaveDetails}
                    >
                      Save Details
                      {buttonLoading && (
                        <Spin size="small" style={{ color: "white" }} />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {!id && isCsvMode && <CsvImport />}
              {!isCsvMode && (
                <>
                  <Form
                    form={form}
                    name="properties"
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    className="mobile"
                  >
                    {properties.map((_, index) => (
                      <div
                        key={index}
                        className={styles.formsection}
                      >
                        <div>
                        <Form.Item
  label="Rental Property Address Line 1"
  name={["properties", index, "address_line_1"]}
  rules={[
    {
      required: true,
      message: "Please input your Rental Property Address Line 1!",
    },
    {
      max: 100,
      message: "Address Line 1 cannot exceed 100 characters.",
    },
  ]}
>
  <Input
    className={styles?.custminput}
    placeholder="21 Street Park villa"
    maxLength={100} // Enforces the character limit in the input field
  />
</Form.Item>

<Form.Item
  label="Rental Property Address Line 2"
  name={["properties", index, "address_line_2"]}
  rules={[
    {
      max: 100,
      message: "Address Line 2 cannot exceed 100 characters.",
    },
  ]}
>
  <Input
    className={styles?.custminput}
    placeholder="Avenue Part"
    maxLength={100} // Enforces the character limit in the input field
  />
</Form.Item>

                          <Form.Item
                            label="Country"
                            name={["properties", index, "country"]}
                            rules={[
                              {
                                required: true,
                                message: "Please select your Country!",
                              },
                            ]}
                          >
                            <Select
                              placeholder="Select Country"
                              onChange={(value) => handleCountryChange(value)}
                              value={selectedCountry}
                              showSearch
                              filterOption={(input, option) =>
                                option.children
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            >
                              {countries.map((country) => (
                                <Option
                                  key={country.id}
                                  value={country.id}
                                  style={{
                                    padding: 30,
                                    borderRadius: "20px",
                                  }}
                                >
                                  {country.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            label="State"
                            name={["properties", index, "state"]}
                            rules={[
                              {
                                required: true,
                                message: "Please select your State!",
                              },
                            ]}
                          >
                            <Select
                              placeholder="Select State"
                              onChange={(value) => handleStateChange(value)}
                              value={selectedState}
                              showSearch
                              disabled={!selectedCountry}
                              filterOption={(input, option) =>
                                option.children
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            >
                              {states.map((state) => (
                                <Option key={state.id} value={state.id}>
                                  {state.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            label="City"
                            name={["properties", index, "city"]}
                            rules={[
                              {
                                required: true,
                                message: "Please select your City!",
                              },
                            ]}
                          >
                            <Select
                              placeholder="Select City"
                              onChange={(value) => setSelectedCity(value)}
                              value={selectedCity}
                              showSearch
                              disabled={!selectedState}
                              filterOption={(input, option) =>
                                option.children
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            >
                              {cities.map((city) => (
                                <Option key={city.id} value={city.id}>
                                  {city.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            label="Rental Property Owner Name"
                            name={["properties", index, "property_owner_name"]}
                            rules={[
                              {
                                required: true,
                                message:
                                  "Please input your Rental Property Owner Name!",
                              },
                              {
                                max: 50,
                                message:
                                  "Rental Property Owner Name cannot exceed 50 characters.",
                              },
                            ]}
                          >
                            <Input
                              className={styles?.custminput}
                              placeholder="John Harper"
                              maxLength={50} // Optional: Enforces the limit in the input field
                            />
                          </Form.Item>

                          <Form.Item
                            label={
                              selectedCountry === 233
                                ? "Zip Code"
                                : "Postal Code"
                            }
                            name={["properties", index, "zip_code"]}
                            rules={[
                              {
                                required: true,
                                message: `Please input your ${
                                  selectedCountry === 233 ? "Zip" : "Postal"
                                } Code!`,
                              },
                              {
                                validator: (_, value) => {
                                  if (!value) return Promise.resolve(); // Skip if empty (required rule will catch it)

                                  // US - 5 digits, Canada - 6 characters (alphanumeric)
                                  if (
                                    selectedCountry === 233 &&
                                    !/^\d{5}$/.test(value)
                                  ) {
                                    return Promise.reject(
                                      new Error(
                                        "US Zip Code must be exactly 5 digits."
                                      )
                                    );
                                  }
                                  if (
                                    selectedCountry === 39 &&
                                    !/^[A-Za-z0-9]{6}$/.test(value)
                                  ) {
                                    return Promise.reject(
                                      new Error(
                                        "Canadian Postal Code must be exactly 6 characters."
                                      )
                                    );
                                  }

                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <Input
                              className={styles?.custminput}
                              placeholder={
                                selectedCountry === 233 ? "12345" : "A1A1A1"
                              }
                            />
                          </Form.Item>
                          <Form.Item
                            label="Email 1"
                            name={[
                              "properties",
                              index,
                              "property_owner_email_1",
                            ]}
                            rules={[
                              {
                                required: true,
                                message: "Please input your Email 1!",
                              },
                            ]}
                          >
                            <Input
                              className={styles?.custminput}
                              placeholder="johnharper@gmail.com"
                            />
                          </Form.Item>
                          <Form.Item
                            label="Email 2"
                            name={[
                              "properties",
                              index,
                              "property_owner_email_2",
                            ]}
                          >
                            <Input
                              className={styles?.custminput}
                              placeholder="harper@gmail.com"
                            />
                          </Form.Item>
                          <Form.Item
                            label="Phone Number 1"
                            name={[
                              "properties",
                              index,
                              "property_owner_mobile_number_1",
                            ]}
                            rules={[
                              {
                                required: true,
                                validator: validatePhoneNumber1,
                              },
                            ]}
                          >
                            <PhoneInput
                              defaultCountry="US"
                              placeholder="Enter phone number"
                              international
                              className={styles.custminput}
                              countries={["US", "CA"]}
                            />
                          </Form.Item>
                          <Form.Item
                            label="Phone Number 2"
                            name={[
                              "properties",
                              index,
                              "property_owner_mobile_number_2",
                            ]}
                            rules={[
                              {
                                validator: validatePhoneNumber2,
                              },
                            ]}
                          >
                            <PhoneInput
                              defaultCountry="US"
                              placeholder="Enter phone number"
                              international
                              className={styles.custminput}
                              countries={["US", "CA"]}
                            />
                          </Form.Item>
                        </div>
                      </div>
                    ))}
                  </Form>
                  <Form
                    form={form}
                    name="properties"
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    className="desktop"
                  >
                    {properties.map((_, index) => (
                      <div
                        key={index}
                        className={styles.formsection}
                      >
                        <div>
                          <div style={{ justifySelf: "right" }}>
                            {properties.length > 1 && (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeProperty(index)}
                              >
                                Remove Property
                              </Button>
                            )}
                          </div>
                          <Space>
                          <Form.Item
  label="Rental Property Address Line 1"
  name={["properties", index, "address_line_1"]}
  rules={[
    {
      required: true,
      message: "Please input your Rental Property Address Line 1!",
    },
    {
      max: 100,
      message: "Address Line 1 cannot exceed 100 characters.",
    },
  ]}
>
  <Input
    className={styles?.custminput}
    placeholder="21 Street Park villa"
    maxLength={100} // Enforces the character limit in the input field
  />
</Form.Item>

<Form.Item
  label="Rental Property Address Line 2"
  name={["properties", index, "address_line_2"]}
  rules={[
    {
      max: 100,
      message: "Address Line 2 cannot exceed 100 characters.",
    },
  ]}
>
  <Input
    className={styles?.custminput}
    placeholder="Avenue Part"
    maxLength={100} // Enforces the character limit in the input field
  />
</Form.Item>

                          </Space>
                          <Space>
                            <Form.Item
                              label="Country"
                              name={["properties", index, "country"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Please select your Country!",
                                },
                              ]}
                            >
                              <Select
                                placeholder="Select Country"
                                onChange={(value) => handleCountryChange(value)}
                                value={selectedCountry}
                                showSearch
                                filterOption={(input, option) =>
                                  option.children
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                              >
                                {countries.map((country) => (
                                  <Option
                                    key={country.id}
                                    value={country.id}
                                    style={{
                                      padding: 30,
                                      borderRadius: "20px",
                                    }}
                                  >
                                    {country.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Form.Item
                              label="State"
                              name={["properties", index, "state"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Please select your State!",
                                },
                              ]}
                            >
                              <Select
                                placeholder="Select State"
                                onChange={(value) => handleStateChange(value)}
                                value={selectedState}
                                showSearch
                                disabled={!selectedCountry}
                                filterOption={(input, option) =>
                                  option.children
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                              >
                                {states.map((state) => (
                                  <Option key={state.id} value={state.id}>
                                    {state.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Form.Item
                              label="City"
                              name={["properties", index, "city"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Please select your City!",
                                },
                              ]}
                            >
                              <Select
                                placeholder="Select City"
                                onChange={(value) => setSelectedCity(value)}
                                value={selectedCity}
                                showSearch
                                disabled={!selectedState}
                                filterOption={(input, option) =>
                                  option.children
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                              >
                                {cities.map((city) => (
                                  <Option key={city.id} value={city.id}>
                                    {city.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Space>
                          <Space>
                            <Form.Item
                              label="Rental Property Owner Name"
                              name={[
                                "properties",
                                index,
                                "property_owner_name",
                              ]}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Please input your Rental Property Owner Name!",
                                },
                                {
                                  max: 50,
                                  message:
                                    "Rental Property Owner Name cannot exceed 50 characters.",
                                },
                              ]}
                            >
                              <Input
                                className={styles?.custminput}
                                placeholder="John Harper"
                                maxLength={50} // Optional: Enforces the limit in the input field
                              />
                            </Form.Item>

                            <Form.Item
                              label={
                                selectedCountry === 233
                                  ? "Zip Code"
                                  : "Postal Code"
                              }
                              name={["properties", index, "zip_code"]}
                              rules={[
                                {
                                  required: true,
                                  message: `Please input your ${
                                    selectedCountry === 233 ? "Zip" : "Postal"
                                  } Code!`,
                                },
                                {
                                  validator: (_, value) => {
                                    if (!value) return Promise.resolve(); // Skip if empty (required rule will catch it)

                                    // US - 5 digits, Canada - 6 characters (alphanumeric)
                                    if (
                                      selectedCountry === 233 &&
                                      !/^\d{5}$/.test(value)
                                    ) {
                                      return Promise.reject(
                                        new Error(
                                          "US Zip Code must be exactly 5 digits."
                                        )
                                      );
                                    }
                                    if (
                                      selectedCountry === 39 &&
                                      !/^[A-Za-z0-9]{6}$/.test(value)
                                    ) {
                                      return Promise.reject(
                                        new Error(
                                          "Canadian Postal Code must be exactly 6 characters."
                                        )
                                      );
                                    }

                                    return Promise.resolve();
                                  },
                                },
                              ]}
                            >
                              <Input
                                className={styles?.custminput}
                                placeholder={
                                  selectedCountry === 233 ? "12345" : "A1A1A1"
                                }
                              />
                            </Form.Item>
                          </Space>
                          <Space>
                            <Form.Item
                              label="Email 1"
                              name={[
                                "properties",
                                index,
                                "property_owner_email_1",
                              ]}
                              rules={[
                                {
                                  required: true,
                                  message: "Please input your Email 1!",
                                },
                                {
                                  type: "email",
                                  message: "Please enter a valid Email!",
                                },
                              ]}
                            >
                              <Input
                                className={styles?.custminput}
                                placeholder="johnharper@gmail.com"
                              />
                            </Form.Item>
                            <Form.Item
                              label="Email 2"
                              name={[
                                "properties",
                                index,
                                "property_owner_email_2",
                              ]}
                              rules={[
                                {
                                  type: "email",
                                  message: "Please enter a valid Email!",
                                },
                              ]}
                            >
                              <Input
                                className={styles?.custminput}
                                placeholder="harper@gmail.com"
                              />
                            </Form.Item>
                          </Space>
                          <Space>
                            <Form.Item
                              label="Phone Number 1"
                              name={[
                                "properties",
                                index,
                                "property_owner_mobile_number_1",
                              ]}
                              rules={[
                                {
                                  required: true,
                                  validator: validatePhoneNumber1,
                                },
                              ]}
                            >
                              <PhoneInput
                                defaultCountry="US"
                                placeholder="Enter phone number"
                                international
                                className={styles.custminput}
                                countries={["US", "CA"]}
                              />
                            </Form.Item>
                            <Form.Item
                              label="Phone Number 2"
                              name={[
                                "properties",
                                index,
                                "property_owner_mobile_number_2",
                              ]}
                              rules={[
                                {
                                  validator: validatePhoneNumber2,
                                },
                              ]}
                            >
                              <PhoneInput
                                defaultCountry="US"
                                placeholder="Enter phone number"
                                international
                                className={styles.custminput}
                                countries={["US", "CA"]}
                              />
                            </Form.Item>
                          </Space>
                        </div>
                      </div>
                    ))}
                  </Form>
                  {!propertyData && (
                    <h6 onClick={addPropertyForm}>+ Add More Property</h6>
                  )}
                </>
              )}
            </Container>
          </div>
        </>
      )}
    </>
  );
};
export default PropertyForm;
