export const getLocalStore = (key: string) => {
  if (typeof window === "undefined") return null;
  const store = localStorage.getItem(key);
  if (store) {
    return JSON.parse(store);
  }
  return null;
};

export const setLocalStore = (key: string, value: any) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};
