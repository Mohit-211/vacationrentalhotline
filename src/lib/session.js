import secureLocalStorage from "react-secure-storage";

export const clearToken = () => {
  if (typeof window !== "undefined") {
    return secureLocalStorage.removeItem("usertoken");
  }
  return null;
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    return secureLocalStorage.getItem("usertoken");
  }
  return null;
};
