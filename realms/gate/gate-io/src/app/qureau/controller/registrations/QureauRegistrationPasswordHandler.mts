import { HonoGuardAuthentication } from "@levicape/spork/router/hono/guard/security/HonoGuardAuthentication";
import type { KeygenKsort } from "@levicape/spork/server/security/IdKeygen";
import { StatusCodes } from "http-status-codes";
import {
	RegistrationRegister,
	RegistrationRegisterRequest,
	type RegistrationRegisterResponse,
} from "../../../../_protocols/qureau/tsnode/domain/registration/register/registration.register.js";
import { QureauResponse } from "../../../../_protocols/qureau/tsnode/service/qureau._.js";
import {
	QureauResponseVersionEnum,
	QureauVersionEnum,
} from "../../../../_protocols/qureau/tsnode/service/version.js";
import { Qureau, version } from "../../Qureau.mjs";
import { QQUsersError } from "../../service/QureauUser.mjs";
import { qqZodError } from "../QureauBadRequestExceptionHandler.mjs";
import { QureauRegistrationPasswordRegisterCommandZod } from "./QureauRegistrationPasswordCommand.mjs";

const registrationRegisterInfers = (
	headers: Record<string, string | undefined>,
	keygen: KeygenKsort,
): RegistrationRegister["inferred"] => {
	return {
		requestId: headers.X_Request_Id ?? keygen.ksort(),
		rootId: headers.X_Root_Id ?? keygen.ksort(),
		responseId: keygen.ksort(),
		// meeloId: request.header("X-Koala-Id") ?? ksuidGenerator.syncString(),
		// zugV1: request.header("X-Zug-V1") ?? ksuidGenerator.syncString(),
	};
};

export const QureauRegistrationPasswordHandler = Qureau().createHandlers(
	HonoGuardAuthentication(async ({ principal }) => {
		return principal.$case === "anonymous";
	}),
	async (c) => {
		const { body, status, json } = c;
		const { success, error, data } =
			await QureauRegistrationPasswordRegisterCommandZod.safeParseAsync(await c.req.json());

		if (error || data === undefined) {
			return json(
				QureauResponse.toJSON({
					error: qqZodError(error),
					version,
				}) as QureauResponse,
				StatusCodes.BAD_REQUEST,
			);
		}

		if (
			data?.request.generateAuthenticationToken === false &&
			data?.request.registration.authenticationToken === undefined
		) {
			return json(
				QureauResponse.toJSON({
					error: {
						code: "QQ_MANUAL_AUTHENTICATION_TOKEN_REQUIRED",
						message:
							"generateAuthenticationToken = false requires a valid authenticationToken",
						cause: undefined,
						validations: [],
					},
					version,
				}) as QureauResponse,
				StatusCodes.BAD_REQUEST,
			);
		}

		const register: RegistrationRegisterResponse =
			await c.var.Registration.Register(
				RegistrationRegister.fromPartial({
					request: RegistrationRegisterRequest.fromJSON(data.request),
					// inferred: registrationRegisterInfers(headers, ksuidGenerator),
					ext: data.ext,
				}),
			).catch((error) => {
				throw error;
			});

		return json(
			QureauResponse.toJSON({
				data: {
					registration: {
						register,
					},
				},
				version: {
					response: QureauResponseVersionEnum.QUREAU_R_LATEST,
					qureau: QureauVersionEnum.QUREAU_V_V1,
				},
			}) as QureauResponse,
			StatusCodes.CREATED,
		);
	},
);
