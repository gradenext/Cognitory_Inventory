import { ZodError } from "zod";

export function validateWithZod(schema, data) {
  try {
    schema.parse(data);
    return { success: true, errors: [] };
  } catch (err) {
    if (err instanceof ZodError) {
      let error = {};

      err.errors.forEach((e) => (error[e.path.join(".")] = e.message));

      const meta = err.errors.map((e) => ({
        path: e.path,
        key: e.path.join("."),
        message: e.message,
      }));
      return { success: false, errors: { error, meta } };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}
