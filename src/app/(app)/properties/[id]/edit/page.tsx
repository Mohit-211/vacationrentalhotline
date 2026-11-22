"use client";

import { getProperty } from "@/lib/api/properties";
import type { Property } from "@/lib/api/types";
import PropertyForm from "@/features/properties/PropertyForm";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
const EditPropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const [propertyData, setPropertyData] = useState<Property | null>(null);
  useEffect(() => {
    if (id) {
      getProperty(id)
        .then((res) => {
          setPropertyData(res?.data?.data);
        })
        .catch((e) => {
          console.log(e, "error");
        });
    }
  }, [id]);
  return <PropertyForm propertyData={propertyData} />;
};

export default EditPropertyPage;
