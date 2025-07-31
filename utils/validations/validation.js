const { ZodError } = require("zod");
const { ResponseError } = require("../response");

class Validation {
    static validate(schema, data) {
        try {
            return schema.parse(data);
        } catch (err) {
            if (err instanceof ZodError) {
                const messages = err.errors[0]?.message || "Validasi gagal"
                throw new ResponseError(400, messages);
            }
            throw err;
        }
    }
}

module.exports = Validation;