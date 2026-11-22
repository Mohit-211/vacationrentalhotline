"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
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
import { getCities, getCountries, getStates } from "@/lib/api/locations";
import { getProfile, updateProfile } from "@/lib/api/profile";
import type { City, Country, State, UpdateProfileInput } from "@/lib/api/types";
import { isEmail, isValidPhone } from "@/lib/validation";

const filled = (value: unknown) => value !== undefined && value !== null && value !== "";
const text = (message: string) => z.unknown().refine(filled, message);

const schema = z.object({
  name: text("Please input your name!"),
  email: text("Please input your email!").refine((v) => isEmail(String(v)), "Please input your email!"),
  mobile: z
    .unknown()
    .superRefine((value, ctx) => {
      if (!filled(value)) ctx.addIssue({ code: "custom", message: "Please input your mobile!" });
      else if (!isValidPhone(String(value))) ctx.addIssue({ code: "custom", message: "Invalid phone number." });
    }),
  address: text("Please input your home address!"),
  zip_code: text("Please input your zip code!"),
});

type ProfileFormValues = Partial<Record<keyof UpdateProfileInput, string | number | null>>;

const EditProfileForm = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { control, handleSubmit, reset } = useForm<ProfileFormValues>({
    // `raw` hands the form's own values to onFinish, untouched by the schema.
    resolver: zodResolver(schema, undefined, { raw: true }) as Resolver<ProfileFormValues>,
    mode: "onChange",
  });

  const handleCountryChange = (countryId: number) => {
    setSelectedCountry(countryId);
    setSelectedState(null);
    setCities([]);
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
    getCities(stateId)
      .then((res) => {
        setCities(res?.data?.data || []);
      })
      .catch((error) => {
        console.error("Error fetching cities:", error);
      });
  };

  useEffect(() => {
    getCountries()
      .then((res) => {
        setCountries(
          res?.data?.data.filter((country) => country.name === "Canada" || country.name === "United States") || []
        );
      })
      .catch((error) => {
        console.error("Error fetching countries:", error);
      });

    getProfile()
      .then((res) => {
        const profileData = res?.data?.data;
        if (profileData) {
          setPhoneNumber(profileData?.mobile);
          reset({
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
    // Loads once, like the old form; the change handlers are plain functions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values: ProfileFormValues) => {
    setLoading(true);
    // As before, the number sent is the one loaded with the profile
    // (or the one typed), not necessarily the one the field showed.
    const updatedValues = { ...values, mobile: phoneNumber } as UpdateProfileInput;
    try {
      const res = await updateProfile(updatedValues);
      toast.success(res?.data?.message || "Profile Updated");
    } catch (e) {
      console.error("Error updating profile:", e);
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

  const locationOptions = (items: { id: number; name: string }[]) =>
    items.map((item) => ({ value: item.id, label: item.name }));

  return (
    <form noValidate autoComplete="off" onSubmit={handleSubmit(onFinish)} className="grid gap-5 md:grid-cols-2">
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormField id="profile_name" label="Name" required error={fieldState.error?.message} className="md:col-span-2">
            <Input
              ref={field.ref}
              value={(field.value as string | null | undefined) ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              placeholder="Enter Name"
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField id="profile_email" label="Email" required error={fieldState.error?.message}>
            <Input value={(field.value as string | null | undefined) ?? ""} placeholder="Enter Email" disabled readOnly />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="mobile"
        render={({ field, fieldState }) => (
          <FormField id="profile_mobile" label="Mobile" required error={fieldState.error?.message}>
            <PhoneInput
              placeholder="Enter Mobile Number"
              defaultCountry="US"
              countries={["US", "CA"]}
              value={(field.value as string | null | undefined) ?? undefined}
              onChange={(value) => {
                field.onChange(value);
                setPhoneNumber(value);
              }}
              onBlur={field.onBlur}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field, fieldState }) => (
          <FormField
            id="profile_address"
            label="Home Address"
            required
            error={fieldState.error?.message}
            className="md:col-span-2"
          >
            <Textarea
              ref={field.ref}
              rows={4}
              value={(field.value as string | null | undefined) ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              placeholder="Enter your Home Address"
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="country_id"
        render={({ field }) => (
          <FormField id="profile_country_id" label="Country">
            <Combobox
              placeholder="Select Country"
              searchPlaceholder="Search country"
              options={locationOptions(countries)}
              value={field.value as number | null | undefined}
              onChange={(value) => {
                field.onChange(value);
                handleCountryChange(value as number);
              }}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="state_id"
        render={({ field }) => (
          <FormField id="profile_state_id" label="State">
            <Combobox
              placeholder="Select State"
              searchPlaceholder="Search state"
              options={locationOptions(states)}
              value={field.value as number | null | undefined}
              disabled={!selectedCountry}
              onChange={(value) => {
                field.onChange(value);
                handleStateChange(value as number);
              }}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="city_id"
        render={({ field }) => (
          <FormField id="profile_city_id" label="City">
            <Combobox
              placeholder="Select City"
              searchPlaceholder="Search city"
              options={locationOptions(cities)}
              value={field.value as number | null | undefined}
              disabled={!selectedState}
              onChange={(value) => field.onChange(value)}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="zip_code"
        render={({ field, fieldState }) => (
          <FormField id="profile_zip_code" label="Zip Code" required error={fieldState.error?.message}>
            <Input
              ref={field.ref}
              value={(field.value as string | null | undefined) ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              placeholder="Enter Zip Code"
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
