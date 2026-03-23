import type { ITable } from "@levicape/spork/server/client/table/ITable";
import type { KeygenKsort } from "@levicape/spork/server/security/IdKeygen";
import type { RefreshToken } from "../../../../_protocols/qureau/tsnode/domain/token/token._._.js";
import {
	User,
	UserContentStatus,
} from "../../../../_protocols/qureau/tsnode/domain/user/user._._.js";
import { UserRegistration } from "../../../../_protocols/qureau/tsnode/domain/user/user._._.registration._._.js";
import { QureauTableUsersEntity } from "../../../../_protocols/qureau/tsnode/table/user/table.user._.js";
import {
	QQUserNameExistsError,
	QQUsersError,
} from "../../service/QureauUser.mjs";
import type { QureauUserCredentialRepository } from "./QureauUserRepository.Credential.mjs";
import type { QureauUserTokenRepository } from "./QureauUserRepository.Token.mjs";
import type {
	QureauRepositoryProps,
	QureauUserRepository,
} from "./QureauUserRepository.mjs";
import { QureauUserApplicationRow } from "./user/QureauUserRow.Application.mjs";
import type { QureauUserCredentialRow } from "./user/QureauUserRow.Credential.mjs";
import type { QureauUserTokenRow } from "./user/QureauUserRow.Token.mjs";
import type { QureauUserKey, QureauUserRow } from "./user/QureauUserRow.mjs";

export type CreateUserAndRegisterProps = {
	applicationId: string;
	user: Partial<User>;
	password?: string;
	genAuthenticationToken: () => Promise<
		(RefreshToken & { userId: string; id: string }) | undefined
	>;
	genRefreshToken: () => Promise<RefreshToken & { userId: string; id: string }>;
};

export type CreateUserAndRegisterResult = {
	rows: {
		user: QureauUserRow;
		registration: QureauUserApplicationRow;
		tokens: QureauUserTokenRow[];
		credential?: QureauUserCredentialRow;
	};
	data: {
		user: User;
		registration: UserRegistration;
		tokens: RefreshToken[];
	};
};

export class QureauUserRegistrationRepository {
	constructor(
		private readonly keygen: KeygenKsort,
		private readonly users: ITable<QureauUserApplicationRow, QureauUserKey>,
		private readonly userRepository: QureauUserRepository,
		private readonly userTokenRepository: QureauUserTokenRepository,
		private readonly credentialRepository: QureauUserCredentialRepository,
	) {}

	registrationRowForUserRegistration = async (
		user: User,
		userRegistration: UserRegistration,
		props: QureauRepositoryProps,
	): Promise<QureauUserApplicationRow> => {
		const { applicationId } = { applicationId: "uwu", ...userRegistration };
		const nowunix = Date.now();
		const nowiso = new Date(nowunix).toISOString();

		if (user.id === undefined) {
			throw new Error("User must have an id")
		}

		const row = new QureauUserApplicationRow(
			applicationId as "uwu",
			user.id,
			user,
			userRegistration,
			nowiso,
			props.domain.principal,
			{
				...props.domain.request,
				resourceVersion: nowiso,
			},
			props.domain.scrypt,
		);

		return row;
	};

	createUserAndRegister = async (
		register: CreateUserAndRegisterProps,
		props: QureauRepositoryProps,
	): Promise<CreateUserAndRegisterResult> => {
		const {
			applicationId,
			password,
			genAuthenticationToken: generateAuthenticationToken,
			genRefreshToken: generateRefreshToken,
		} = register;
		const user = User.fromPartial({
			...register.user,
			id: props.domain.principal.principalId,
		});
		const userrow = QureauTableUsersEntity.toJSON(
			await this.userRepository.userRowForUser({
				...user,
				id: user.id!,
			}, props),
		) as QureauUserRow;

		const tokens = {
			authenticationToken: await generateAuthenticationToken(),
			refreshToken: await generateRefreshToken(),
		};

		const registration = UserRegistration.fromPartial({
			applicationId,
			authenticationToken: tokens.authenticationToken?.id ?? "owo",
			cleanSpeakId: undefined,
			id: this.keygen.ksort(),
			timezone: "UTC",
			username: user.username,
			usernameStatus: UserContentStatus.UserContentStatus_ACTIVE,
			verified: false,
			verifiedInstant: 0,
			preferredLanguages: user.preferredLanguages,
			lastLoginInstant: undefined,
			lastUpdateInstant: undefined,
			//
			roles: [
				{
					name: "user",
					permissions: [
						{
							entity: user.id,
							resource: userrow.pk,
							access: "*",
						},
					],
				},
			],
		});

		const registrationrow = QureauTableUsersEntity.toJSON(
			await this.registrationRowForUserRegistration(
				user as User,
				registration,
				props,
			),
		) as QureauUserApplicationRow;
		const tokenrows = [];
		for (const token of Object.values(tokens)) {
			if (token) {
				const tokenrow = await this.userTokenRepository.tokenRowForRefreshToken(
					token,
					props,
				);
				if (tokenrow) {
					tokenrows.push(
						QureauTableUsersEntity.toJSON(tokenrow) as QureauUserTokenRow,
					);
				}
			}
		}

		let credentialrow: QureauUserCredentialRow | undefined;
		if (password) {
			if (user.id === undefined) { 
				throw new Error("User must have an id") 
			};

			credentialrow = await this.credentialRepository.createPasswordForUser(
				user.id,
				password,
				props,
			);
		}

		try {
			await this.users.insert(userrow.pk, [
				userrow,
				registrationrow,
				...(credentialrow ? [credentialrow] : []),
				...(tokenrows ?? []),
			]);
		} catch (error) {
			wrapAndThrow(error);
		}

		return {
			rows: {
				user: userrow,
				registration: registrationrow,
				tokens: tokenrows,
				credential: credentialrow,
			},
			data: {
				user,
				registration,
				tokens: [
					...([tokens.authenticationToken] as RefreshToken[]),
					tokens.refreshToken,
				],
			},
		};
	};
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const wrapAndThrow = (error: unknown) => {
	const dbError = error as { table?: string; constraint?: string };
	if (dbError.table !== undefined && dbError.constraint !== undefined) {
		if (dbError.constraint.includes("pk_unique_key")) {
			throw new QQUsersError(
				400,
				new QQUserNameExistsError("User must have a unique username"),
			);
		}
	}
	throw error;
};
