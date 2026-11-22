import secureLocalStorage from "react-secure-storage";

export const removeLocalStorageItem = () => {
  if (typeof window !== "undefined") {
    return secureLocalStorage.removeItem("usertoken");
  }
  return null;
};

export const getLocalStorageItem = () => {
  if (typeof window !== "undefined") {
    return secureLocalStorage.getItem("usertoken");
  }
  return null;
};
