import { ZodError } from "zod";

export function validateWithZod(schema, data) {
  try {
    schema.parse(data);
    return { success: true, errors: [] };
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => {
        const error = {
          meta: {
            path: e.path,
            key: e.path.join("."),
            message: e.message,
          },
        };
        error[e.path.join(".")] = e.message;

        return error;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}
