import { z } from "zod";

const allowAnonymous = false;

export const QureauRegistrationPasswordRegisterCommandZod = z.object({
	request: z
		.object({
			user: z
				.object({
					preferredLanguages: z.array(z.string().max(12).min(2)).optional(),
					timezone: z.string().max(64).min(1).optional(),
					firstName: z.string().max(55).min(1).optional(),
					middleName: z.string().max(55).min(1).optional(),
					lastName: z.string().max(55).min(1).optional(),
					fullName: z.string().max(165).min(1).optional(),
					birthDate: z.iso.datetime().optional(),
					mobilePhone: z.string().max(15).min(7).optional(),
					passwordChangeRequired: z.boolean().default(false),
					username: allowAnonymous
						? z.string().optional()
						: z
								.string()
								.max(36)
								.min(4)
								.refine(
									(v) => {
										return /^[a-zA-Z0-9_]+$/.test(v);
									},
									{
										message:
											"registration.register.request.user.username.format",
									},
								),
					email: allowAnonymous
						? z.string().optional()
						: z.email().max(255).optional(),
					password: z
						.string()
						.refine(
							(v) => {
								return /(?=.*[A-Z])/.test(v);
							},
							// TODO: Is there a protocol somewhere in here for forms
							{
								message:
									"registration.register.request.user.password.uppercase_required",
							},
						)
						.refine(
							(v) => {
								return /(?=.*[a-z])/.test(v);
							},
							{
								message:
									"registration.register.request.user.password.lowercase_required",
							},
						)
						.refine(
							(v) => {
								return /(?=.*[0-9])/.test(v);
							},
							{
								message:
									"registration.register.request.user.password.number_required",
							},
						)
						.refine(
							(v) => {
								return /(?=.*[^A-Za-z0-9])/.test(v);
							},
							{
								message:
									"registration.register.request.user.password.symbol_required",
							},
						)
						.refine(
							(v) => {
								return v.length >= 8;
							},
							{
								message:
									"registration.register.request.user.password.length_required",
							},
						)
						.refine(
							(v) => {
								return v.length <= 255;
							},
							{
								message: "registration.register.request.user.password.length_max",
							},
						),

					// TODO: password emails
					//.optional(),
					// sendSetPasswordEmail: z.boolean().default(false),
					twoFactor: z
						.object({
							methods: z
								.array(
									z.union([
										z.object({
											method: z.literal("email"),
											email: z.email(),
										}),
										z.object({
											method: z.literal("sms"),
											mobilePhone: z.string().max(32),
										}),
									]),
								)
								.min(1),
						})
						.optional(),
				})
				,
			registration: z
				.object({
					applicationId: z
						.literal("tsk")
						.or(z.literal("qru"))
						.or(z.literal("bq"))
						.or(z.literal("yyzyxyy"))
						.default("yyzyxyy"),
					authenticationToken: z.string().max(131072).base64().optional(),
				})
				.default({
					applicationId: "yyzyxyy",
				}),
			generateAuthenticationToken: z.boolean().default(true),
		})
		,
	ext: z.object({
		nonce: z.string().min(4).max(255).default("TODO: sync with header"),
	}),
});
