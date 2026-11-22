"use client";

import React, { useState, useRef } from "react";
import { FaFileUpload } from "react-icons/fa";
import type { CsvRow } from "./CsvImport";

interface CsvDropzoneProps {
  handleFileUpload: (file: File) => void;
  setData: (rows: CsvRow[]) => void;
  setShowBtn: (show: boolean) => void;
  setError: (error: string | null) => void;
}

const CsvDropzone = ({ handleFileUpload, setData ,setShowBtn,setError}: CsvDropzoneProps) => {
  const [fileName, setFileName] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if the file type is CSV
      if (file.type !== "text/csv") {
        setErrorMessage("Only CSV files are allowed.");
        return;
      }
      setErrorMessage("");
      handleFileUpload(file);
      setFileName(file.name);
      setIsFileUploaded(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Check if the file type is CSV
      if (file.type !== "text/csv") {
        setErrorMessage("Only CSV files are allowed.");
        return;
      }
      setErrorMessage("");
      handleFileUpload(file);
      setFileName(file.name);
      setIsFileUploaded(true);
    }
  };
  const handleRemoveFile = () => {

    setShowBtn(false)
    setFileName("");
    setIsFileUploaded(false);
    setData([]);
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  return (
    <div className="UploadComponent">
      <div
        className="upload-files-container"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="drag-file-area">
          <h5
            className="material-icons-outlined upload-icon"
            style={{ fontSize: "28px" }}
          >
            CSV Upload
          </h5>
          <FaFileUpload size={50} className="icons_upload" />
          <h3 className="dynamic-message">
            {isFileUploaded
              ? `${fileName} File Dropped Successfully!`
              : "Drag & drop a CSV file here"}
          </h3>
          {isFileUploaded && (
            <div className="Btn-changes-file">
              <div className="file-block" style={{cursor:"pointer"}}>
                <label>
                  <span className="browse-files">
                    <input
                      type="file"
                      className="default-file-input"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv"
                    />
                    <span className="file-info"style={{cursor:"pointer"}} >Change</span>
                  </span>
                </label>
              </div>

              <div className="file-block" onClick={handleRemoveFile}>
                <div className="file-info">Delete</div>
              </div>
            </div>
          )}
          {!isFileUploaded && (
            <label className="label">
              <h5 className="m-2">or</h5>
              <span className="browse-files">
                <input
                  type="file"
                  className="default-file-input"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                />
                <span className="browse-files-text">browse a CSV file </span>
                <span style={{color:"black"}}>from device</span>
              </span>
            </label>
          )}
        </div>
        {errorMessage && (
          <span className="cannot-upload-message">
            <span className="material-icons-outlined">error</span>
            {errorMessage}
            <span
              className="material-icons-outlined cancel-alert-button"
              onClick={() => setErrorMessage("")}
            >
              cancel
            </span>
          </span>
        )}
      </div>
    </div>
  );
};
export default CsvDropzone;
