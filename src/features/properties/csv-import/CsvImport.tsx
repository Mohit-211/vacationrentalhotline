"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { toast } from "sonner";
import { BookOpen, CircleAlert, Download } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { createProperties } from "@/lib/api/properties";
import type { PropertyInput } from "@/lib/api/types";
import CsvDropzone from "./CsvDropzone";
import CsvInstructions from "./CsvInstructions";
import MappingExample from "./MappingExample";

/** One CSV row, keyed by the column names in the file's header row. */
export type CsvRow = Record<string, string>;

interface MappedField {
  name: keyof PropertyInput;
  label: string;
  required?: boolean;
}

const importFields: MappedField[] = [
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
];

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
      initialMappings[field.name] = keys.includes(field.name) ? field.name : "";
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
      const newRow: PropertyInput = {};
      importFields.forEach((field) => {
        newRow[field.name] = getFieldData(row, field.name);
      });
      return newRow;
    });

    const allValues = { properties: mappedData };
    setLoading(true);

    createProperties(allValues)
      .then((res) => {
        toast.success(`${res?.data?.message}`);
        setData([]);
        setFieldMappings({});
        router.push("/dashboard");
      })
      .catch((e) => {
        console.error(e, "error");
      })
      .finally(() => {
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
            <Button
              size="lg"
              className="mt-6"
              onClick={handleImport}
              disabled={data.length === 0 || missingRequired}
            >
              Submit
              {loading && <Spinner label="Submitting" />}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
};

export default CsvImport;
