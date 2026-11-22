"use client";

import React, { useEffect, useState } from "react";
import styles from "./EditProfileForm.module.scss";
import { Container } from "react-bootstrap";
import { Form, Input, Button, Select, message, Skeleton } from "antd";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { getCities, getCountries, getStates } from "@/lib/api/locations";
import { getProfile, updateProfile } from "@/lib/api/profile";
import type { City, Country, State, UpdateProfileInput } from "@/lib/api/types";

const EditProfileForm = () => {
  const [isClient, setIsClient] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>("");
  const { TextArea } = Input;
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [form] = Form.useForm<UpdateProfileInput>();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setLoadingData(true);
      // Fetch country codes (limited to US and Canada)
      getCountries()
        .then((res) => {
          setCountries(res?.data?.data.filter(country => country.name === "Canada" || country.name === "United States") || []);
        })
        .catch((error) => {
          console.error("Error fetching countries:", error);
        });
        
      // Fetch profile data and populate form
      getProfile()
        .then((res) => {
          const profileData = res?.data?.data;
          if (profileData) {
            setPhoneNumber(profileData?.mobile);
            form.setFieldsValue({
              name: profileData?.user_profile?.name,
              email: profileData?.email,
              mobile: profileData?.user_profile?.mobile,
              address: profileData?.user_profile?.address,
              country_id: profileData?.user_profile?.country_id,
              state_id: profileData?.user_profile?.state_id,
              city_id: profileData?.user_profile?.city_id,
              zip_code: profileData?.user_profile?.zip_code,
            });
            setSelectedCountry(profileData?.user_profile?.country_id ?? null);
            setSelectedState(profileData?.user_profile?.state_id ?? null);
            if (profileData?.user_profile?.country_id) {
              handleCountryChange(profileData?.user_profile?.country_id);
            }
            if (profileData?.user_profile?.state_id) {
              handleStateChange(profileData?.user_profile?.state_id);
            }
          }
          setLoadingData(false);
        })
        .catch((e) => {
          console.error("Error fetching profile:", e);
          setLoadingData(false);
        });
    } else {
      setLoadingData(false);
    }
  }, [isClient]);

  const handleCountryChange = (countryId: number) => {
    setSelectedCountry(countryId);
    setSelectedState(null);
    setCities([]);

    // Fetch states based on selected country
    getStates(countryId)
      .then((res) => {
        setStates(res?.data?.data[0]?.all_state || []);
      })
      .catch((error) => {
        console.error("Error fetching states:", error);
      });
  };

  const handleStateChange = (stateId: number) => {
    setSelectedState(stateId);

    // Fetch cities based on selected state
    getCities(stateId)
      .then((res) => {
        setCities(res?.data?.data || []);
      })
      .catch((error) => {
        console.error("Error fetching cities:", error);
      });
  };

  const handlePhoneNumberChange = (value?: string) => {
    setPhoneNumber(value);
  };

  const validatePhoneNumber = (rule: unknown, value?: string) => {
    if (!value) {
      return Promise.reject("Phone number is required.");
    }
    const phoneNumber = parsePhoneNumberFromString(value);
    if (phoneNumber && phoneNumber.isValid()) {
      return Promise.resolve();
    }
    return Promise.reject("Invalid phone number.");
  };

  const onFinish = async (values: UpdateProfileInput) => {
    setLoading(true);
    const updatedValues = { ...values, mobile: phoneNumber };
    try {
      const res = await updateProfile(updatedValues);
      message.success(res?.data?.message || "Profile Updated");
    } catch (e) {
      console.error("Error updating profile:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.EditProfile}>
      <Container>
        {loadingData ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : isClient ? (
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please input your name!" }]}>
              <Input placeholder="Enter Name" />
            </Form.Item>
            <div className={styles.divided}>
              <Form.Item className={styles.ctminputline} label="Email" name="email" rules={[{ required: true, type: "email", message: "Please input your email!" }]}>
                <Input placeholder="Enter Email" disabled />
              </Form.Item>
              <Form.Item className={styles.ctminputline} label="Mobile" name="mobile" rules={[{ required: true, message: "Please input your mobile!" }, { validator: validatePhoneNumber }]}>
                <PhoneInput placeholder="Enter Mobile Number" value={phoneNumber} onChange={handlePhoneNumberChange} defaultCountry="US" countries={["US", "CA"]} inputClass="custom-phone-input" />
              </Form.Item>
            </div>
            <Form.Item label="Home Address" name="address" rules={[{ required: true, message: "Please input your home address!" }]}>
              <TextArea rows={4} placeholder="Enter your Home Address" />
            </Form.Item>
            <div className={styles.divided}>
              <Form.Item label="Country" name="country_id" className={styles.ctminputline}>
                <Select placeholder="Select Country" onChange={handleCountryChange} showSearch filterOption={(input, option) => String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())}>
                  {countries.map((country) => (
                    <Select.Option key={country.id} value={country.id}>
                      {country.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="State" name="state_id" className={styles.ctminputline}>
                <Select placeholder="Select State" onChange={handleStateChange} disabled={!selectedCountry} showSearch filterOption={(input, option) => String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())}>
                  {states.map((state) => (
                    <Select.Option key={state.id} value={state.id}>
                      {state.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className={styles.divided}>
              <Form.Item label="City" name="city_id" className={styles.ctminputline}>
                <Select placeholder="Select City" disabled={!selectedState} showSearch filterOption={(input, option) => String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())}>
                  {cities.map((city) => (
                    <Select.Option key={city.id} value={city.id}>
                      {city.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Zip Code" name="zip_code" rules={[{ required: true, message: "Please input your zip code!" }]}>
                <Input placeholder="Enter Zip Code" />
              </Form.Item>
            </div>
            <Form.Item>
              <Button className="submit_btn_theme m-0" htmlType="submit" loading={loading}>
                Save Details
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <p>No Profile found. Please log in.</p>
        )}
      </Container>
    </div>
  );
};

export default EditProfileForm;
