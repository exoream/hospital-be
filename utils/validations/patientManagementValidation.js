const { z } = require("zod");

class PatientManagementValidation {
    static createSchema = z.object({
        pasien_id: z
            .number({ invalid_type_error: "Pasien ID harus berupa angka" })
            .int()
            .positive("Pasien ID wajib diisi"),

        tanggal_kunjungan: z
            .string()
            .refine((val) => !isNaN(Date.parse(val)), {
                message: "Tanggal kunjungan tidak valid",
            }),

        waktu: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
                message: "Format waktu harus HH:MM (24 jam)",
            }),

        riwayat_id: z
            .number({ invalid_type_error: "Pasien ID harus berupa angka" })
            .int()
            .positive("Riwayat ID wajib diisi"),
    });

    static updateSchema = z
        .object({
            tanggal_kunjungan: z
                .string()
                .refine((val) => !isNaN(Date.parse(val)), {
                    message: "Tanggal kunjungan tidak valid (format harus YYYY-MM-DD)",
                })
                .optional(),

            waktu: z
                .string()
                .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
                    message: "Format waktu harus HH:MM (24 jam)",
                })
                .optional(),

            keterangan: z
                .string()
                .min(5, "Keterangan minimal 5 karakter")
                .max(255, "Keterangan maksimal 255 karakter")
                .optional(),

            status: z
                .enum(["pending", "confirmed", "done", "rescheduled", "canceled"])
                .optional().nullable(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "Minimal satu data harus diubah",
        });

}

module.exports = PatientManagementValidation;
