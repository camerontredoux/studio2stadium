export const mockApi = {
  success: <T>(data: T, delay: number = 500): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(data), delay)),
  logged: <T>(data: T, delay: number = 500): Promise<T> =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log("Fetched session");
        resolve(data);
      }, delay),
    ),
};
