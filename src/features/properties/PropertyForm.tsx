"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, type Control, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { PageLoader, Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Switch";
import CsvImport from "@/features/properties/csv-import/CsvImport";
import { getCities, getCountries, getStates } from "@/lib/api/locations";
import { createProperties, updateProperty } from "@/lib/api/properties";
import type { City, Country, Property, PropertyInput, State } from "@/lib/api/types";
import { useIsClient } from "@/lib/useIsClient";
import { isEmail, isValidPhone } from "@/lib/validation";

const US = 233;
const CANADA = 39;

/** The fields one property block registers; nothing else is sent. */
const PROPERTY_FIELDS = [
  "address_line_1",
  "address_line_2",
  "country",
  "state",
  "city",
  "property_owner_name",
  "zip_code",
  "property_owner_email_1",
  "property_owner_email_2",
  "property_owner_mobile_number_1",
  "property_owner_mobile_number_2",
] as const;
type PropertyField = (typeof PROPERTY_FIELDS)[number];

type PropertyFields = { [K in PropertyField]?: string | number | null };
interface PropertyFormValues {
  properties: PropertyFields[];
}
type FieldName = FieldPath<PropertyFormValues>;

// Fields the user never touched stay undefined, so they're left out of the
// request exactly as the old form left them out.
const pickFields = (property: PropertyFields): PropertyInput => {
  const picked: Record<string, unknown> = {};
  for (const key of PROPERTY_FIELDS) picked[key] = property[key];
  return picked as PropertyInput;
};

const filled = (value: unknown) => value !== undefined && value !== null && value !== "";

/** A rule: return true when the value passes, or the error message. */
type Rule = (value: unknown) => true | string;
const rules = (...checks: Rule[]) =>
  z.unknown().superRefine((value, ctx) => {
    for (const check of checks) {
      const result = check(value);
      if (result !== true) {
        ctx.addIssue({ code: "custom", message: result });
        return;
      }
    }
  });
const required = (message: string): Rule => (value) => filled(value) || message;
const maxLength = (max: number, message: string): Rule => (value) =>
  !filled(value) || String(value).length <= max || message;
const email: Rule = (value) => !filled(value) || isEmail(String(value)) || "Please enter a valid Email!";
const phone: Rule = (value) => !filled(value) || isValidPhone(String(value)) || "Invalid phone number.";

/** The rules the old form applied; ZIP rules follow the selected country. */
function buildSchema(selectedCountry: number | null) {
  const zipCode: Rule = (value) => {
    if (!filled(value)) return true;
    if (selectedCountry === US && !/^\d{5}$/.test(String(value))) return "US Zip Code must be exactly 5 digits.";
    if (selectedCountry === CANADA && !/^[A-Za-z0-9]{6}$/.test(String(value)))
      return "Canadian Postal Code must be exactly 6 characters.";
    return true;
  };
  const property = z.object({
    address_line_1: rules(
      required("Please input your Rental Property Address Line 1!"),
      maxLength(100, "Address Line 1 cannot exceed 100 characters.")
    ),
    address_line_2: rules(maxLength(100, "Address Line 2 cannot exceed 100 characters.")),
    country: rules(required("Please select your Country!")),
    state: rules(required("Please select your State!")),
    city: rules(required("Please select your City!")),
    property_owner_name: rules(
      required("Please input your Rental Property Owner Name!"),
      maxLength(50, "Rental Property Owner Name cannot exceed 50 characters.")
    ),
    zip_code: rules(required(`Please input your ${selectedCountry === US ? "Zip" : "Postal"} Code!`), zipCode),
    property_owner_email_1: rules(required("Please input your Email 1!"), email),
    property_owner_email_2: rules(email),
    property_owner_mobile_number_1: rules(required("Phone number is required."), phone),
    property_owner_mobile_number_2: rules(phone),
  });
  return z.object({ properties: z.array(property) });
}

const fieldId = (name: string) => name.replaceAll(".", "_");

interface FieldProps {
  control: Control<PropertyFormValues>;
  name: FieldName;
  label: string;
  required?: boolean;
}

function TextField({ control, name, label, required, placeholder, maxLength }: FieldProps & { placeholder?: string; maxLength?: number }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField id={fieldId(name)} label={label} required={required} error={fieldState.error?.message}>
          <Input
            ref={field.ref}
            name={field.name}
            value={(field.value as string | number | null | undefined) ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        </FormField>
      )}
    />
  );
}

function PhoneField({ control, name, label, required }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField id={fieldId(name)} label={label} required={required} error={fieldState.error?.message}>
          <PhoneInput
            defaultCountry="US"
            placeholder="Enter phone number"
            international
            countries={["US", "CA"]}
            value={(field.value as string | null | undefined) ?? undefined}
            onChange={(value) => field.onChange(value)}
            onBlur={field.onBlur}
          />
        </FormField>
      )}
    />
  );
}

function SelectField({
  control,
  name,
  label,
  placeholder,
  options,
  disabled,
  onSelect,
}: FieldProps & {
  placeholder: string;
  options: { id: number; name: string }[];
  disabled?: boolean;
  onSelect: (value: number) => void;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField id={fieldId(name)} label={label} required error={fieldState.error?.message}>
          <Combobox
            placeholder={placeholder}
            searchPlaceholder={`Search ${label.toLowerCase()}`}
            options={options.map((option) => ({ value: option.id, label: option.name }))}
            value={field.value as string | number | null | undefined}
            disabled={disabled}
            onChange={(value) => {
              field.onChange(value);
              onSelect(value as number);
            }}
          />
        </FormField>
      )}
    />
  );
}

const PropertyForm = ({ propertyData }: { propertyData?: Property | null }) => {
  const router = useRouter();
  const { id } = useParams();
  const isClient = useIsClient();
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [isCsvMode, setIsCsvMode] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const { control, handleSubmit, reset, getValues } = useForm<PropertyFormValues>({
    // Rebuilt each render, since ZIP rules depend on the selected country.
    // `raw` hands the form's own values to onFinish, untouched by the schema.
    resolver: zodResolver(buildSchema(selectedCountry), undefined, { raw: true }) as Resolver<PropertyFormValues>,
    mode: "onChange",
    defaultValues: { properties: [propertyData ? { ...propertyData } : {}] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "properties" });

  const addPropertyForm = () => {
    append({});
  };

  const removeProperty = (indexToRemove: number) => {
    if (fields.length > 1) {
      remove(indexToRemove);
    } else {
      toast.warning("At least one property is required");
    }
  };

  const onFinish = (values: PropertyFormValues) => {
    const allValues = { properties: getValues("properties").map(pickFields) };
    allValues.properties.forEach((property) => {
      property.country = countries.find((c) => c.id === selectedCountry)?.name;
      property.state = states.find((s) => s.id === selectedState)?.name;
      property.city = cities.find((c) => c.id === selectedCity)?.name;
    });
    setButtonLoading(true);
    const apiCall = propertyData
      ? updateProperty(propertyData.id, pickFields(values.properties[0]))
      : createProperties(allValues);
    apiCall
      .then((res) => {
        toast.success(res?.data?.message);
        reset({ properties: [{}] });
        router.push("/dashboard");
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setButtonLoading(false);
      });
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    if (propertyData) {
      reset({ properties: [{ ...propertyData }] });
    }
  }, [propertyData, reset]);

  useEffect(() => {
    getCountries()
      .then((res) => {
        const allCountries = res?.data?.data || [];
        const filteredCountries = allCountries.filter(
          (country) => country.name === "United States" || country.name === "Canada"
        );
        setCountries(filteredCountries);
      })
      .catch((e) => {
        console.log(e, "error");
      });
  }, []);

  // As before, picking a country or state reloads the next list but does not
  // clear the State/City already chosen (in the audit, for the bug step).
  const handleCountryChange = (value: number) => {
    setSelectedCountry(value);
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

  const handleStateChange = (value: number) => {
    setSelectedState(value);
    getCities(value)
      .then((res) => {
        setCities(res?.data?.data || []);
        setSelectedCity(null);
      })
      .catch((e) => {
        console.log(e, "error");
      });
  };

  if (!isClient) {
    return <PageLoader />;
  }

  const block = (index: number): ReactNode => {
    const name = (field: PropertyField) => `properties.${index}.${field}` as FieldName;
    return (
      <section
        key={fields[index].id}
        aria-label={`Property ${index + 1}`}
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex min-h-9 items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Property {index + 1}</h2>
          {fields.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-soft"
              onClick={() => removeProperty(index)}
            >
              <Trash2 aria-hidden="true" />
              Remove Property
            </Button>
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            control={control}
            name={name("address_line_1")}
            label="Rental Property Address Line 1"
            required
            placeholder="21 Street Park villa"
            maxLength={100}
          />
          <TextField
            control={control}
            name={name("address_line_2")}
            label="Rental Property Address Line 2"
            placeholder="Avenue Part"
            maxLength={100}
          />
          <div className="grid gap-5 md:col-span-2 md:grid-cols-3">
            <SelectField
              control={control}
              name={name("country")}
              label="Country"
              placeholder="Select Country"
              options={countries}
              onSelect={handleCountryChange}
            />
            <SelectField
              control={control}
              name={name("state")}
              label="State"
              placeholder="Select State"
              options={states}
              disabled={!selectedCountry}
              onSelect={handleStateChange}
            />
            <SelectField
              control={control}
              name={name("city")}
              label="City"
              placeholder="Select City"
              options={cities}
              disabled={!selectedState}
              onSelect={(value) => setSelectedCity(value)}
            />
          </div>
          <TextField
            control={control}
            name={name("property_owner_name")}
            label="Rental Property Owner Name"
            required
            placeholder="John Harper"
            maxLength={50}
          />
          <TextField
            control={control}
            name={name("zip_code")}
            label={selectedCountry === US ? "Zip Code" : "Postal Code"}
            required
            placeholder={selectedCountry === US ? "12345" : "A1A1A1"}
          />
          <TextField
            control={control}
            name={name("property_owner_email_1")}
            label="Email 1"
            required
            placeholder="johnharper@gmail.com"
          />
          <TextField
            control={control}
            name={name("property_owner_email_2")}
            label="Email 2"
            placeholder="harper@gmail.com"
          />
          <PhoneField control={control} name={name("property_owner_mobile_number_1")} label="Phone Number 1" required />
          <PhoneField control={control} name={name("property_owner_mobile_number_2")} label="Phone Number 2" />
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={id ? "Update Property" : "Add New Property"}
        back={
          <Button asChild variant="ghost" size="icon" aria-label="Back to dashboard" className="mt-0.5 -ml-2">
            <Link href="/dashboard">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        }
        actions={
          <>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium">
              Switch to CSV Upload
              <Switch checked={isCsvMode} onCheckedChange={(checked) => setIsCsvMode(checked)} />
            </label>
            {!isCsvMode && (
              <Button type="submit" form="property-form">
                Save Details
                {buttonLoading && <Spinner label="Saving" />}
              </Button>
            )}
          </>
        }
      />
      {!id && isCsvMode && <CsvImport />}
      {!isCsvMode && (
        <form
          id="property-form"
          noValidate
          autoComplete="off"
          onSubmit={handleSubmit(onFinish, onFinishFailed)}
          className="space-y-6"
        >
          {fields.map((_, index) => block(index))}
          {!propertyData && (
            <Button type="button" variant="outline" onClick={addPropertyForm}>
              <Plus aria-hidden="true" />
              Add More Property
            </Button>
          )}
        </form>
      )}
    </div>
  );
};

export default PropertyForm;
