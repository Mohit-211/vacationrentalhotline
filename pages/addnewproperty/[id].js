import { GetPropertyDetailApi } from "@/components/apis/propertyApi";
import AddNewProperty from "@/components/newPages/AddNewProperty/AddNewProperty";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
const AddNewPropertyPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [propertyData, setPropertyData] = useState(null);
  useEffect(() => {
    if (id) {
      GetPropertyDetailApi(id)
        .then((res) => {
          setPropertyData(res?.data?.data);
        })
        .catch((e) => {
          console.log(e, "error");
        });
    }
  }, [id]);
  return (
    <>
      <AddNewProperty propertyData={propertyData} />
    </>
  );
};

export default AddNewPropertyPage;
