const { z } = require("zod");

class PasienValidation {
    static createPasienSchema = z.object({
        username: z
            .string()
            .min(4, "Username minimal 4 karakter")
            .max(20, "Username maksimal 20 karakter"),

        password: z
            .string()
            .min(6, "Password minimal 6 karakter")
            .max(50, "Password maksimal 50 karakter"),

        nama_lengkap: z
            .string()
            .min(3, "Nama lengkap minimal 3 karakter")
            .max(50, "Nama lengkap maksimal 50 karakter")
            .refine((val) => !/\d/.test(val), {
                message: "Nama lengkap tidak boleh mengandung angka",
            }),

        nik: z
            .string()
            .regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka"),

        tanggal_lahir: z
            .string()
            .refine((val) => {
                const birthDate = new Date(val);
                if (isNaN(birthDate.getTime())) return false;

                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                const isBirthdayPassed =
                    today.getMonth() > birthDate.getMonth() ||
                    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

                const finalAge = isBirthdayPassed ? age : age - 1;

                return finalAge >= 60;
            }, {
                message: "Pasien harus berusia minimal 60 tahun",
            }),

        jenis_kelamin: z
            .enum(["L", "P"], {
                errorMap: () => ({ message: "Jenis kelamin harus L (Laki-laki) atau P (Perempuan)" }),
            }),

        alamat: z
            .string()
            .min(10, "Alamat minimal 10 karakter")
            .max(100, "Alamat maksimal 100 karakter"),


    });

    static updatePasienSchema = z
        .object({
            nik: z
                .string()
                .regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka")
                .optional(),

            tanggal_lahir: z
                .string()
                .refine((val) => !isNaN(Date.parse(val)), {
                    message: "Tanggal lahir tidak valid",
                })
                .optional(),

            jenis_kelamin: z
                .enum(["L", "P"], {
                    errorMap: () => ({
                        message: "Jenis kelamin harus L (Laki-laki) atau P (Perempuan)",
                    }),
                })
                .optional(),

            alamat: z
                .string()
                .min(5, "Alamat minimal 5 karakter")
                .max(100, "Alamat maksimal 100 karakter")
                .optional(),

            nama_lengkap: z
                .string()
                .min(3, "Nama lengkap minimal 3 karakter")
                .max(50, "Nama lengkap maksimal 50 karakter")
                .refine((val) => !/\d/.test(val), {
                    message: "Nama lengkap tidak boleh mengandung angka",
                })
                .optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "Minimal satu field harus diisi",
        });
}

module.exports = PasienValidation;