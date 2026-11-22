"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/Spinner";
import PropertyForm from "@/features/properties/PropertyForm";
import { getProperty } from "@/lib/api/properties";
import type { Property } from "@/lib/api/types";

const EditPropertyPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [propertyData, setPropertyData] = useState<Property>();

  useEffect(() => {
    getProperty(id)
      .then((res) => setPropertyData(res.data.data))
      // Not found (or not this account's): the API client has said so.
      .catch(() => router.replace("/dashboard"));
  }, [id, router]);

  // The form waits for the property, so nothing can be saved half-loaded.
  if (!propertyData) return <PageLoader />;
  return <PropertyForm propertyData={propertyData} />;
};

export default EditPropertyPage;
