export const safeParse = async (response: Response) => {
  const result = await response.text();
  try {
    return JSON.parse(result);
  } catch {
    return { message: result };
  }
};
