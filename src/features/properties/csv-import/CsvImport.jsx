"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { message, Form, Select, Button, Spin, Drawer } from "antd";
import { useRouter } from "next/navigation";

import styles from "./CsvImport.module.scss";
import { createProperties } from "@/lib/api/properties";
import CsvDropzone from "./CsvDropzone";
import CsvInstructions from "./CsvInstructions";
import MappingExample from "./MappingExample";

const { Option } = Select;

const CsvImport = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [showBtn, setShowBtn] = useState(false);
  const [selectedFields] = useState([
    { name: "property_owner_name", label: "Rental Property Owner Name", required: true },
    { name: "property_owner_email_1", label: "Email 1", required: true },
    { name: "property_owner_email_2", label: "Email 2" },
    { name: "property_owner_mobile_number_1", label: "Phone Number 1", required: true },
    { name: "property_owner_mobile_number_2", label: "Phone Number 2" },
    { name: "address_line_1", label: "Rental Property Address Line 1", required: true },
    { name: "address_line_2", label: "Rental Property Address Line 2" },
    { name: "city", label: "City", required: true },
    { name: "state", label: "State", required: true },
    { name: "zip_code", label: "ZIP Code", required: true },
    { name: "country", label: "Country", required: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false); // To manage the Drawer visibility
  const router = useRouter();

  // Function to handle file upload
  const handleFileUpload = (event) => {
    setShowBtn(true);
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (!result.data || result.data.length === 0) {
            setError("Your CSV file cannot be empty.");
            setData([]); // Reset data if the file is empty
          } else {
            const keys = Object?.keys(result.data[0]);
            setFieldMappings(generateInitialMappings(keys));
            setData(result.data);
            setError(null); // Clear any previous errors
          }
        },
        error: (err) => {
          setError(err.message);
          setData([]); // Reset data if there is an error
        },
      });
    } else {
      setError("Please upload a valid CSV file.");
      setData([]); // Reset data if no file is uploaded
    }
  };

  // Generate initial mappings for fields
  const generateInitialMappings = (keys) => {
    const initialMappings = {};
    selectedFields.forEach((field) => {
      initialMappings[field.name] = keys.includes(field.name) ? field.name : "";
    });
    return initialMappings;
  };

  // Handle field mapping change
  const handleFieldMappingChange = (fieldName, value) => {
    setFieldMappings((prevMappings) => ({
      ...prevMappings,
      [fieldName]: value,
    }));
  };

  // Generate and submit the data
  const handleGenerateAndSubmit = () => {
    const mappedData = data.map((row) => {
      const newRow = {};
      selectedFields.forEach((field) => {
        newRow[field.name] = getFieldData(row, field.name);
      });
      return newRow;
    });

    const allValues = { properties: mappedData };
    setLoading(true);

    createProperties(allValues)
      .then((res) => {
        message.success(`${res?.data?.message}`);
        setData([]); // Reset data
        setFieldMappings({}); // Reset field mappings
        router.push("/dashboard"); // Redirect to dashboard
      })
      .catch((e) => {
        console.error(e, "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Get field data for each row
  const getFieldData = (row, fieldName) => {
    const field = fieldMappings[fieldName];
    return field ? row[field] : "";
  };

  // Toggle Drawer visibility
  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <div className={styles.CSvFile}>
      <div className={styles.instructioncsv}>
        <CsvInstructions />
        <Button
          onClick={toggleDrawer}
          type="primary"
          style={{ width: "fit-content", margin: "10px 20px" }}
          className="submit_btn_theme"
        >
         View Mapping Example for CSV Upload
        </Button>
      </div>
      <div className={styles.csvUpload}>
        {/* Drawer component for off-canvas display */}
        <Drawer
          title="Mapping Example Steps:"
          placement="right"
          onClose={toggleDrawer}
          open={drawerVisible}
          width={400}
        >
          <div className={styles.instructioncsv1}>
            <MappingExample />
          </div>
        </Drawer>

        <CsvDropzone
          handleFileUpload={handleFileUpload}
          setData={setData}
          setShowBtn={setShowBtn}
          setError={setError}
        />
        {!showBtn && (
          <div>
            <a href="/Propertysample.csv" download>
              <Button
                style={{ width: "fit-content", margin: "10px 20px" }}
                className="submit_btn_theme"
              >
                Download Sample CSV
              </Button>
            </a>
          </div>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {data.length > 0 && (
          <div style={{ width: "100%" }}>
            <Form layout="vertical">
              {selectedFields.map((field) => (
                <Form.Item
                  key={field.name}
                  label={
                    <span>
                      {field.required && <span style={{ color: "red" }}>*</span>}
                      {field.label}
                    </span>
                  }
                >
                  <Select
                    value={fieldMappings[field.name]}
                    onChange={(value) => handleFieldMappingChange(field.name, value)}
                    placeholder={`Select ${field.label}`}
                  >
                    <Option value="">-- Select --</Option>
                    {Object.keys(data[0]).map((csvField) => (
                      <Option key={csvField} value={csvField}>
                        {csvField}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ))}
            </Form>
            <Button
              type="primary"
              onClick={handleGenerateAndSubmit}
              disabled={
                data.length === 0 ||
                selectedFields.some(
                  (field) => field.required && !fieldMappings[field.name]
                )
              }
              className={styles.add_new}
            >
              Submit
              {loading && <Spin size="small" style={{ color: "white" }} />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvImport;
