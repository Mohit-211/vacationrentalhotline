"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { updateAccount } from "@/lib/api/account";
import type { Account } from "@/lib/api/types";
import { COUNTRIES, findCountry, isCountryCode, isValidPostalCode } from "@/lib/locations";
import { isValidPhone } from "@/lib/validation";

const schema = z
  .object({
    name: z.string().trim().min(1, "Please input your name!").max(150, "Name cannot exceed 150 characters."),
    email: z.string(),
    // Optional, as at sign-up; a number that is given must be valid.
    phone: z.string().refine((value) => !value || isValidPhone(value), "Invalid phone number."),
    streetAddress: z
      .string()
      .trim()
      .min(1, "Please input your home address!")
      .max(255, "Address cannot exceed 255 characters."),
    city: z.string().trim().max(100, "City cannot exceed 100 characters."),
    countryCode: z.string(),
    regionCode: z.string(),
    postalCode: z.string().trim().min(1, "Please input your zip code!").max(10, "Please enter a valid zip code."),
  })
  .refine((values) => !isCountryCode(values.countryCode) || isValidPostalCode(values.countryCode, values.postalCode), {
    path: ["postalCode"],
    when: () => true,
    error: (issue) =>
      (issue.input as { countryCode?: string })?.countryCode === "CA"
        ? "Canadian Postal Code must look like A1A 1A1."
        : "US Zip Code must be 5 digits, or ZIP+4 such as 12345-6789.",
  });
type ProfileFormValues = z.infer<typeof schema>;

const emptyProfile: ProfileFormValues = {
  name: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  countryCode: "",
  regionCode: "",
  postalCode: "",
};

const countryOptions = COUNTRIES.map((country) => ({ value: country.code, label: country.name }));

/** Edits the account the page loaded; `onSaved` gets the saved account back. */
const EditProfileForm = ({ account, onSaved }: { account?: Account; onSaved?: (account: Account) => void }) => {
  const [loading, setLoading] = useState(false);
  const loadingData = !account;
  const { control, handleSubmit, reset, setValue, getValues, trigger } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: emptyProfile,
  });
  const countryCode = useWatch({ control, name: "countryCode" });
  const country = findCountry(countryCode);

  useEffect(() => {
    if (!account) return;
    reset({
      name: account.name,
      email: account.email,
      phone: account.phone ?? "",
      streetAddress: account.streetAddress ?? "",
      city: account.city ?? "",
      countryCode: account.countryCode ?? "",
      regionCode: account.regionCode ?? "",
      postalCode: account.postalCode ?? "",
    });
  }, [account, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const res = await updateAccount({
        name: values.name,
        phone: values.phone || null,
        streetAddress: values.streetAddress,
        city: values.city || null,
        countryCode: values.countryCode || null,
        regionCode: values.regionCode || null,
        postalCode: values.postalCode,
      });
      reset({ ...values, postalCode: res.data.data.postalCode ?? "" });
      onSaved?.(res.data.data);
      toast.success("Profile Updated Successfully.");
    } catch {
      // The API client has already shown the error.
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6" aria-busy="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <form method="post" noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormField id="profile_name" label="Name" required error={fieldState.error?.message} className="md:col-span-2">
            <Input {...field} placeholder="Enter Name" autoComplete="name" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <FormField id="profile_email" label="Email" hint="Change it in the Change Email tab.">
            <Input value={field.value} placeholder="Enter Email" disabled readOnly />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <FormField id="profile_mobile" label="Mobile" error={fieldState.error?.message}>
            <PhoneInput
              placeholder="Enter Mobile Number"
              defaultCountry="US"
              countries={["US", "CA"]}
              value={field.value || undefined}
              onChange={(value) => field.onChange(value ?? "")}
              onBlur={field.onBlur}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="streetAddress"
        render={({ field, fieldState }) => (
          <FormField
            id="profile_address"
            label="Home Address"
            required
            error={fieldState.error?.message}
            className="md:col-span-2"
          >
            <Textarea {...field} rows={4} placeholder="Enter your Home Address" autoComplete="street-address" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="countryCode"
        render={({ field }) => (
          <FormField id="profile_country" label="Country">
            <Combobox
              placeholder="Select Country"
              searchPlaceholder="Search country"
              options={countryOptions}
              value={field.value}
              onChange={(value) => {
                field.onChange(String(value));
                // A state from the old country no longer applies, and the
                // postal code is checked against the new country's format.
                setValue("regionCode", "");
                if (getValues("postalCode")) void trigger("postalCode");
              }}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="regionCode"
        render={({ field }) => (
          <FormField id="profile_region" label={country?.regionLabel ?? "State"}>
            <Combobox
              placeholder={`Select ${country?.regionLabel ?? "State"}`}
              searchPlaceholder={`Search ${(country?.regionLabel ?? "state").toLowerCase()}`}
              options={(country?.regions ?? []).map((region) => ({ value: region.code, label: region.name }))}
              value={field.value}
              disabled={!country}
              onChange={(value) => field.onChange(String(value))}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field, fieldState }) => (
          <FormField id="profile_city" label="City" error={fieldState.error?.message}>
            <Input {...field} placeholder="Enter City" autoComplete="address-level2" />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="postalCode"
        render={({ field, fieldState }) => (
          <FormField id="profile_zip_code" label={country?.postalCodeLabel ?? "Zip Code"} required error={fieldState.error?.message}>
            <Input
              {...field}
              placeholder={country ? `e.g. ${country.postalCodeExample}` : "Enter Zip Code"}
              autoComplete="postal-code"
            />
          </FormField>
        )}
      />
      <div className="md:col-span-2">
        <Button type="submit" size="lg" loading={loading}>
          Save Details
        </Button>
      </div>
    </form>
  );
};

export default EditProfileForm;
