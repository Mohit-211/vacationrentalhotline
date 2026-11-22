import secureLocalStorage from "react-secure-storage";

export const clearToken = (): void => {
  if (typeof window !== "undefined") {
    secureLocalStorage.removeItem("usertoken");
  }
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return secureLocalStorage.getItem("usertoken") as string | null;
  }
  return null;
};
