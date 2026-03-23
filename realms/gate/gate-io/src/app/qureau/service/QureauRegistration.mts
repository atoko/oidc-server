import { ulidKeygen, type KeygenSrand } from "@levicape/spork/server/security/IdKeygen";
import { UnsecuredJWT } from "jose";
import { ulid } from "ulidx";
import {
	type RegistrationRegister,
	RegistrationRegisterResponse,
} from "../../../_protocols/qureau/tsnode/domain/registration/register/registration.register.js";
import type { RegistrationRegisterUserResponse } from "../../../_protocols/qureau/tsnode/domain/registration/register/registration.register.user._.response.js";
import type { RegistrationRegisterUserRegistrationResponse } from "../../../_protocols/qureau/tsnode/domain/registration/register/registration.register.user.registration.response.js";
import { RefreshToken } from "../../../_protocols/qureau/tsnode/domain/token/token._._.js";
import { User } from "../../../_protocols/qureau/tsnode/domain/user/user._._.js";
import type { QureauRegistrationService } from "../../../_protocols/qureau/tsnode/service/registration/qureau.registration.js";
import type { QureauJwt } from "../QureauJwt.mjs";
import type { QureauUserRegistrationRepository } from "../repository/users/QureauUserRepository.Registration.mjs";

export class QureauRegistration implements QureauRegistrationService {
	constructor(
		private readonly jwt: ReturnType<typeof QureauJwt>,
		private readonly keygen: KeygenSrand,
		private readonly userApplicationRegistrations: QureauUserRegistrationRepository,
		// private readonly userRole: ITable<QureauUserRoleRow, QureauUserRoleKey>,
		// private readonly userRegistration: ITable<QureauUserRegistrationRow, QureauUserRegistrationKey>,
		// private readonly token: ITable<QureauTaskRow, QureauTaskKey>,
		// private readonly tokenByTenant:
	) {}

	Register = async (
		request: RegistrationRegister,
	): Promise<RegistrationRegisterResponse> => {
		const {
			user,
			registration,
			// sendSetPasswordEmail,
			// skipVerification, // default false
			// TODO: update request body
			// eventInfo,
			// skipRegistrationVerification, // wont support
			// disableDomainBlock, // wont support
		} = request.request ?? {};

		const { applicationId, authenticationToken } = registration ?? {};

		const { requestId, responseId, rootId } = request.inferred ?? {};

		const { nonce } = request.ext ?? {
			nonce: ulid(),
		};

		const userId = request.request?.user?.id ?? ulidKeygen.ksort();
		// TODO: RegistrationRegisterUserRequest -> User mapping
		// Make sure enums are the same
		const userProto = User.fromPartial({
			...(user as User),
			id: userId,
		}) as User & { id: string };

		const nowunix = Date.now();
		const rid = this.keygen.srand();
		const refresh = RefreshToken.fromPartial({
			id: rid,
			userId,
			applicationId,
			token: await this.jwt.refresh((jwt) =>
				jwt.setSubject(userId).setJti(rid),
			),
			startInstant: nowunix,
			data: {
				...(request.request?.user?.data ?? {}),
			},
		}) as RefreshToken & { id: string; userId: string };

		const aid = this.keygen.srand();
		let authentication:
			| (RefreshToken & { id: string; userId: string })
			| undefined;
		let asJwt: ReturnType<typeof UnsecuredJWT.decode> | undefined;
		try {
			asJwt = UnsecuredJWT.decode(authenticationToken ?? "");
		} catch (e) {
			// Parsing error
		}

		if (
			authenticationToken !== undefined &&
			authenticationToken !== "" &&
			authenticationToken !== null &&
			authenticationToken.length > 0 &&
			authenticationToken.length <= 1600 &&
			asJwt !== undefined
		) {
			authentication = RefreshToken.fromPartial({
				id: aid,
				userId,
				applicationId,
				token: authenticationToken,
				startInstant: nowunix,
				data: {
					...(request.request?.user?.data ?? {}),
				},
			}) as RefreshToken & { id: string; userId: string };
		} else {
			// authentication = RefreshToken.fromPartial({
			// 	id: aid,
			// 	userId,
			// 	applicationId,
			// 	token: await this.jwt.access((jwt) =>
			// 		jwt.setSubject(userId).setJti(aid),
			// 	),
			// 	startInstant: nowunix,
			// }) as RefreshToken & { id: string; userId: string };
		}

		const {
			data: { registration: registrationData },
		} = await this.userApplicationRegistrations.createUserAndRegister(
			{
				applicationId: applicationId ?? "uwu",
				user: userProto,
				password: user?.password,
				genAuthenticationToken: async () => {
					return authentication;
				},
				genRefreshToken: async () => {
					return refresh;
				},
			},
			{
				domain: {
					principal: {
						principalId: userId,
						principalAccess: "*",
						principalService: "qureau",
					},
					request: {
						idempotencyId: nonce,
						requestId,
						responseId,
						resourceVersion: new Date().toISOString(),
						executorId: rootId,
						now: nowunix.toString(),
					},
					scrypt: {
						components_: undefined,
						signature_: undefined,
						signingKey_: undefined,
						signatureFromHmacSha256StringToSignUsingSigningKey: "",
					},
				},
			},
		);

		return RegistrationRegisterResponse.fromPartial({
			registered: {
				refreshToken: refresh.token,
				refreshTokenId: refresh.id,
				registration: {
					...registrationData,
					insertInstant: nowunix,
				} as unknown as RegistrationRegisterUserRegistrationResponse,
				registrationVerificationId: "TODO: ",
				registrationVerificationOneTimeCode:
					"The(registrationVerificationOneTimeCode)",
				token: authentication?.token,
				tokenExpirationInstant: 0,
				user: {
					...userProto,
					insertInstant: nowunix,
					registrations: [...(user?.registrations ?? []), registrationData],
				} as unknown as RegistrationRegisterUserResponse,
			},
		} satisfies RegistrationRegisterResponse);
	};
}
