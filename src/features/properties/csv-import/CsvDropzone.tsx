"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CircleAlert, FileCheck2, FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CsvRow } from "./CsvImport";

interface CsvDropzoneProps {
  handleFileUpload: (file: File) => void;
  setData: (rows: CsvRow[]) => void;
  setShowBtn: (show: boolean) => void;
  setError: (error: string | null) => void;
}

const CsvDropzone = ({ handleFileUpload, setData, setShowBtn, setError }: CsvDropzoneProps) => {
  const [fileName, setFileName] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (file: File) => {
    if (file.type !== "text/csv") {
      setErrorMessage("Only CSV files are allowed.");
      return;
    }
    setErrorMessage("");
    handleFileUpload(file);
    setFileName(file.name);
    setIsFileUploaded(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  const handleRemoveFile = () => {
    setShowBtn(false);
    setFileName("");
    setIsFileUploaded(false);
    setData([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileInput = (
    <input type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept=".csv" />
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center rounded-2xl border-2 border-dashed bg-surface px-6 py-10 text-center transition-colors",
          isDragging ? "border-primary-strong bg-primary-soft" : "border-input"
        )}
      >
        <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">CSV Upload</h2>
        <div className="mt-4 flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
          {isFileUploaded ? (
            <FileCheck2 className="size-7" aria-hidden="true" />
          ) : (
            <FileUp className="size-7" aria-hidden="true" />
          )}
        </div>
        <p className="mt-4 font-heading text-lg font-semibold" aria-live="polite">
          {isFileUploaded ? `${fileName} File Dropped Successfully!` : "Drag & drop a CSV file here"}
        </p>
        {isFileUploaded ? (
          <div className="mt-4 flex gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-input bg-surface px-3 text-sm font-semibold shadow-xs hover:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
              {fileInput}
              Change
            </label>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-danger hover:bg-danger-soft"
            >
              Delete
            </button>
          </div>
        ) : (
          <label className="mt-2 cursor-pointer text-sm text-muted-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
            {fileInput}
            or <span className="font-semibold text-primary-strong underline-offset-4 hover:underline">browse a CSV file</span>{" "}
            from device
          </label>
        )}
      </div>
      {errorMessage && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss"
            className="rounded p-0.5 hover:bg-danger/10"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CsvDropzone;
