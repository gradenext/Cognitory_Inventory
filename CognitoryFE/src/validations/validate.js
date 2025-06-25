import { ZodError } from "zod";

export function validateWithZod(schema, data) {
  try {
    schema.parse(data);
    return { success: true, errors: [] };
  } catch (err) {
    if (err instanceof ZodError) {
      let errors = {};
      err.errors.forEach((e) => {
        errors[e.path.join(".")] = e.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}
