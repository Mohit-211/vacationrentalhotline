"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { BookOpen, CircleAlert, Download } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { createProperties } from "@/lib/api/properties";
import type { ApiErrorBody, PropertyInput } from "@/lib/api/types";
import CsvDropzone from "./CsvDropzone";
import CsvInstructions from "./CsvInstructions";
import MappingExample from "./MappingExample";
import { normalizeRow } from "./normalizeRow";

/** One CSV row, keyed by the column names in the file's header row. */
export type CsvRow = Record<string, string>;

interface MappedField {
  name: keyof PropertyInput;
  label: string;
  required?: boolean;
  /** Column headings picked automatically: the sample file's and the old export's. */
  headings: string[];
}

const importFields: MappedField[] = [
  { name: "ownerName", label: "Rental Property Owner Name", required: true, headings: ["Rental Property Owner Name", "property_owner_name"] },
  { name: "ownerEmail", label: "Email 1", required: true, headings: ["Primary Email", "property_owner_email_1"] },
  { name: "ownerAltEmail", label: "Email 2", headings: ["Secondary Email", "property_owner_email_2"] },
  { name: "ownerPhone", label: "Phone Number 1", required: true, headings: ["Primary Phone Number", "property_owner_mobile_number_1"] },
  { name: "ownerAltPhone", label: "Phone Number 2", headings: ["Secondary Phone Number", "property_owner_mobile_number_2"] },
  { name: "addressLine1", label: "Rental Property Address Line 1", required: true, headings: ["Property Address Line 1", "address_line_1"] },
  { name: "addressLine2", label: "Rental Property Address Line 2", headings: ["Property Address Line 2", "address_line_2"] },
  { name: "city", label: "City", required: true, headings: ["City"] },
  { name: "regionCode", label: "State or Province", required: true, headings: ["State", "Province"] },
  { name: "postalCode", label: "ZIP or Postal Code", required: true, headings: ["Postal Code", "ZIP Code", "Zip", "zip_code"] },
  { name: "countryCode", label: "Country", required: true, headings: ["Country"] },
];

const fieldLabel = new Map(importFields.map((field) => [field.name as string, field.label]));
const sameHeading = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** "properties.3.ownerEmail" → "Row 4, Email 1: Please enter a valid Email!" */
function describeRowErrors(fields: Record<string, string[]>): string[] {
  return Object.entries(fields).map(([path, messages]) => {
    const [, index, field] = path.split(".");
    const row = Number(index) + 1;
    return Number.isNaN(row) ? messages[0] : `Row ${row}, ${fieldLabel.get(field) ?? field}: ${messages[0]}`;
  });
}

// The select can't hold an empty value, so "no column" and column names are encoded.
const NO_COLUMN = "none";
const encodeColumn = (column: string) => `column:${column}`;
const decodeColumn = (value: string) => (value === NO_COLUMN ? "" : value.slice("column:".length));

const CsvImport = () => {
  const [data, setData] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [fileChosen, setFileChosen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const router = useRouter();

  const parseFile = (file: File) => {
    setFileChosen(true);
    if (file) {
      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (!result.data || result.data.length === 0) {
            setError("Your CSV file cannot be empty.");
            setData([]);
          } else {
            const keys = Object?.keys(result.data[0]);
            setFieldMappings(generateInitialMappings(keys));
            setData(result.data);
            setError(null);
          }
        },
        error: (err) => {
          setError(err.message);
          setData([]);
        },
      });
    } else {
      setError("Please upload a valid CSV file.");
      setData([]);
    }
  };

  const generateInitialMappings = (keys: string[]) => {
    const initialMappings: Record<string, string> = {};
    importFields.forEach((field) => {
      initialMappings[field.name] =
        keys.find((key) => field.headings.some((heading) => sameHeading(key, heading))) ?? "";
    });
    return initialMappings;
  };

  const handleFieldMappingChange = (fieldName: string, value: string) => {
    setFieldMappings((prevMappings) => ({
      ...prevMappings,
      [fieldName]: value,
    }));
  };

  const getFieldData = (row: CsvRow, fieldName: string) => {
    const field = fieldMappings[fieldName];
    return field ? row[field] : "";
  };

  const handleImport = () => {
    const mappedData = data.map((row) => {
      const newRow = {} as Record<keyof PropertyInput, string>;
      importFields.forEach((field) => {
        newRow[field.name] = getFieldData(row, field.name) ?? "";
      });
      return normalizeRow(newRow);
    });

    setLoading(true);
    setRowErrors([]);
    // All rows are saved, or none: a single bad row stops the import.
    createProperties(mappedData)
      .then((res) => {
        toast.success(`${res.data.data.length} properties imported.`);
        setData([]);
        setFieldMappings({});
        router.push("/dashboard");
      })
      .catch((error) => {
        const fields = isAxiosError<ApiErrorBody>(error) ? error.response?.data?.error?.fields : undefined;
        if (fields) setRowErrors(describeRowErrors(fields));
        setLoading(false);
      });
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const missingRequired = importFields.some((field) => field.required && !fieldMappings[field.name]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[2fr_3fr]">
      <aside className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <CsvInstructions />
        <Button variant="outline" className="mt-6" onClick={() => setExampleOpen(true)}>
          <BookOpen aria-hidden="true" />
          View Mapping Example for CSV Upload
        </Button>
        <Sheet open={exampleOpen} onOpenChange={setExampleOpen}>
          <SheetContent className="max-w-md">
            <SheetHeader>
              <SheetTitle>Mapping Example Steps</SheetTitle>
            </SheetHeader>
            <MappingExample />
          </SheetContent>
        </Sheet>
      </aside>

      <div className="space-y-6">
        <CsvDropzone onFile={parseFile} setData={setData} setFileChosen={setFileChosen} setError={setError} />
        {!fileChosen && (
          <Button asChild variant="outline">
            <a href="/property-import-sample.csv" download>
              <Download aria-hidden="true" />
              Download Sample CSV
            </a>
          </Button>
        )}
        {error && (
          <Alert variant="danger">
            <CircleAlert aria-hidden="true" />
            <p>{error}</p>
          </Alert>
        )}

        {data.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold">Match your columns</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick the CSV column that holds each field. Fields marked * are required.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {importFields.map((field) => (
                <div key={field.name} className="grid gap-1.5">
                  <Label htmlFor={`csv_${field.name}`}>
                    {field.required && (
                      <span aria-hidden="true" className="text-danger">
                        *
                      </span>
                    )}
                    {field.label}
                  </Label>
                  <Select
                    value={fieldMappings[field.name] ? encodeColumn(fieldMappings[field.name]) : NO_COLUMN}
                    onValueChange={(value) => handleFieldMappingChange(field.name, decodeColumn(value))}
                  >
                    <SelectTrigger id={`csv_${field.name}`} aria-required={field.required || undefined}>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_COLUMN}>-- Select --</SelectItem>
                      {columns.map((csvField) => (
                        <SelectItem key={csvField} value={encodeColumn(csvField)}>
                          {csvField}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {rowErrors.length > 0 && (
              <Alert variant="danger" className="mt-6">
                <CircleAlert aria-hidden="true" />
                <div>
                  <p className="font-semibold">Nothing was imported. Fix these rows in your file and try again:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {rowErrors.slice(0, 20).map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                  {rowErrors.length > 20 && <p className="mt-2">…and {rowErrors.length - 20} more.</p>}
                </div>
              </Alert>
            )}
            <Button
              size="lg"
              className="mt-6"
              onClick={handleImport}
              loading={loading}
              disabled={data.length === 0 || missingRequired}
            >
              Submit
            </Button>
          </section>
        )}
      </div>
    </div>
  );
};

export default CsvImport;
