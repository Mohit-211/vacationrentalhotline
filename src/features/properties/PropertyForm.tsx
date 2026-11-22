"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { PageLoader } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Switch";
import CsvImport from "@/features/properties/csv-import/CsvImport";
import { createProperties, updateProperty } from "@/lib/api/properties";
import type { ApiErrorBody, Property, PropertyInput } from "@/lib/api/types";
import { COUNTRIES, findCountry } from "@/lib/locations";
import { propertyInputSchema } from "@/lib/schemas/property";
import { useIsClient } from "@/lib/useIsClient";

/** One property block: every field is a string in the form, "" when empty. */
type PropertyRow = Required<{ [K in keyof PropertyInput]: string }>;
interface PropertyFormValues {
  properties: PropertyRow[];
}
type FieldName = FieldPath<PropertyFormValues>;

const emptyRow: PropertyRow = {
  ownerName: "",
  ownerEmail: "",
  ownerAltEmail: "",
  ownerPhone: "",
  ownerAltPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  countryCode: "",
  regionCode: "",
  postalCode: "",
};

const toRow = (property: Property): PropertyRow => ({
  ownerName: property.ownerName,
  ownerEmail: property.ownerEmail,
  ownerAltEmail: property.ownerAltEmail ?? "",
  ownerPhone: property.ownerPhone,
  ownerAltPhone: property.ownerAltPhone ?? "",
  addressLine1: property.addressLine1,
  addressLine2: property.addressLine2 ?? "",
  city: property.city,
  countryCode: property.countryCode,
  regionCode: property.regionCode,
  postalCode: property.postalCode,
});

// The API's own rules (src/lib/schemas/property.ts), so the form and the
// server agree on every message.
const formSchema = z.object({ properties: z.array(propertyInputSchema) });

const countryOptions = COUNTRIES.map((country) => ({ value: country.code, label: country.name }));
const fieldId = (name: string) => name.replaceAll(".", "_");

interface FieldProps {
  control: Control<PropertyFormValues>;
  name: FieldName;
  label: string;
  required?: boolean;
}

function TextField({ control, name, label, required, placeholder, maxLength, autoComplete }: FieldProps & { placeholder?: string; maxLength?: number; autoComplete?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField id={fieldId(name)} label={label} required={required} error={fieldState.error?.message}>
          <Input
            ref={field.ref}
            name={field.name}
            value={(field.value as string) ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete={autoComplete}
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
            value={(field.value as string) || undefined}
            onChange={(value) => field.onChange(value ?? "")}
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
  options: { value: string; label: string }[];
  disabled?: boolean;
  onSelect?: (value: string) => void;
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
            options={options}
            value={(field.value as string) || null}
            disabled={disabled}
            onChange={(value) => {
              field.onChange(String(value));
              onSelect?.(String(value));
            }}
          />
        </FormField>
      )}
    />
  );
}

/** One property's fields. Each block has its own country, so its own states and labels. */
function PropertyBlock({
  form,
  index,
  canRemove,
  onRemove,
}: {
  form: UseFormReturn<PropertyFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { control, setValue, getValues, trigger } = form;
  const name = (field: keyof PropertyRow) => `properties.${index}.${field}` as FieldName;
  const countryCode = useWatch({ control, name: `properties.${index}.countryCode` });
  const country = findCountry(countryCode);
  const regionLabel = country?.regionLabel ?? "State";
  const postalLabel = country?.postalCodeLabel ?? "Zip Code";

  const handleCountryChange = () => {
    // A state from the other country no longer applies, and the postal code
    // is checked against the new country's format.
    setValue(`properties.${index}.regionCode`, "");
    if (getValues(`properties.${index}.postalCode`)) void trigger(`properties.${index}.postalCode`);
  };

  return (
    <section
      aria-label={`Property ${index + 1}`}
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Property {index + 1}</h2>
        {canRemove && (
          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft" onClick={onRemove}>
            <Trash2 aria-hidden="true" />
            Remove Property
          </Button>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          control={control}
          name={name("addressLine1")}
          label="Rental Property Address Line 1"
          required
          placeholder="21 Street Park villa"
          maxLength={100}
          autoComplete="off"
        />
        <TextField
          control={control}
          name={name("addressLine2")}
          label="Rental Property Address Line 2"
          placeholder="Avenue Part"
          maxLength={100}
          autoComplete="off"
        />
        <div className="grid gap-5 md:col-span-2 md:grid-cols-3">
          <SelectField
            control={control}
            name={name("countryCode")}
            label="Country"
            placeholder="Select Country"
            options={countryOptions}
            onSelect={handleCountryChange}
          />
          <SelectField
            control={control}
            name={name("regionCode")}
            label={regionLabel}
            placeholder={`Select ${regionLabel}`}
            options={(country?.regions ?? []).map((region) => ({ value: region.code, label: region.name }))}
            disabled={!country}
          />
          <TextField control={control} name={name("city")} label="City" required placeholder="Enter City" maxLength={100} />
        </div>
        <TextField
          control={control}
          name={name("ownerName")}
          label="Rental Property Owner Name"
          required
          placeholder="John Harper"
          maxLength={50}
        />
        <TextField
          control={control}
          name={name("postalCode")}
          label={postalLabel}
          required
          placeholder={country?.postalCodeExample ?? "12345"}
          maxLength={10}
        />
        <TextField control={control} name={name("ownerEmail")} label="Email 1" required placeholder="johnharper@gmail.com" />
        <TextField control={control} name={name("ownerAltEmail")} label="Email 2" placeholder="harper@gmail.com" />
        <PhoneField control={control} name={name("ownerPhone")} label="Phone Number 1" required />
        <PhoneField control={control} name={name("ownerAltPhone")} label="Phone Number 2" />
      </div>
    </section>
  );
}

/** Adds properties, or edits one (`propertyData`). */
const PropertyForm = ({ propertyData }: { propertyData?: Property }) => {
  const router = useRouter();
  const isClient = useIsClient();
  const isEditing = Boolean(propertyData);
  const [isCsvMode, setIsCsvMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<PropertyFormValues>({
    // `raw` hands the form's own values to onSubmit; the API trims and normalises them.
    resolver: zodResolver(formSchema, undefined, { raw: true }) as Resolver<PropertyFormValues>,
    mode: "onChange",
    defaultValues: { properties: [propertyData ? toRow(propertyData) : emptyRow] },
  });
  const { control, handleSubmit, reset, setError } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "properties" });

  useEffect(() => {
    if (propertyData) reset({ properties: [toRow(propertyData)] });
  }, [propertyData, reset]);

  const removeProperty = (index: number) => {
    if (fields.length > 1) remove(index);
    else toast.warning("At least one property is required");
  };

  const onSubmit = async (values: PropertyFormValues) => {
    setSaving(true);
    try {
      if (propertyData) {
        await updateProperty(propertyData.id, values.properties[0]);
        toast.success("Property Updated Successfully");
      } else {
        await createProperties(values.properties);
        toast.success(
          values.properties.length === 1
            ? "Property Created Successfully."
            : `${values.properties.length} properties created successfully.`,
        );
      }
      router.push("/dashboard");
    } catch (error) {
      // Show the API's field errors on the fields (an edit's paths have no "properties.0.").
      const fieldErrors = isAxiosError<ApiErrorBody>(error) ? error.response?.data?.error?.fields : undefined;
      for (const [path, messages] of Object.entries(fieldErrors ?? {})) {
        const field = (propertyData ? `properties.0.${path}` : path) as FieldName;
        setError(field, { type: "server", message: messages[0] });
      }
      setSaving(false);
    }
  };

  if (!isClient) {
    return <PageLoader />;
  }

  let content: ReactNode;
  if (!isEditing && isCsvMode) {
    content = <CsvImport />;
  } else {
    content = (
      <form id="property-form" method="post" noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <PropertyBlock
            key={field.id}
            form={form}
            index={index}
            canRemove={fields.length > 1}
            onRemove={() => removeProperty(index)}
          />
        ))}
        {!isEditing && (
          <Button type="button" variant="outline" onClick={() => append(emptyRow)}>
            <Plus aria-hidden="true" />
            Add More Property
          </Button>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={isEditing ? "Update Property" : "Add New Property"}
        back={
          <Button asChild variant="ghost" size="icon" aria-label="Back to dashboard" className="mt-0.5 -ml-2">
            <Link href="/dashboard">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        }
        actions={
          <>
            {!isEditing && (
              <label className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium">
                Switch to CSV Upload
                <Switch checked={isCsvMode} onCheckedChange={(checked) => setIsCsvMode(checked)} />
              </label>
            )}
            {(isEditing || !isCsvMode) && (
              <Button type="submit" form="property-form" loading={saving}>
                Save Details
              </Button>
            )}
          </>
        }
      />
      {content}
    </div>
  );
};

export default PropertyForm;
