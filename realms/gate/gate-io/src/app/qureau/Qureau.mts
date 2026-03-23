import {
	cuidKeygen,
	ulidKeygen,
} from "@levicape/spork/server/security/IdKeygen";
import { createFactory } from "hono/factory";
import type { ParsedFormValue } from "hono/types";
import { env } from "std-env";
import type { QureauResponse } from "../../_protocols/qureau/tsnode/service/qureau._.js";
import {
	QureauResponseVersionEnum,
	QureauVersionEnum,
} from "../../_protocols/qureau/tsnode/service/version.js";
import type { HttpMiddleware } from "../../http/HonoApp.mjs";
import { QureauJwt, type QureauJwts } from "./QureauJwt.mjs";
import {
	type AuthorizeQueryConfiguration,
	AuthorizeQueryParamsZod,
} from "./controller/login/AuthorizeQueryParams.mjs";
import { TokenQueryParamsZod } from "./controller/tokens/TokenQueryParams.mjs";
import {
	qureauUserTokensTable,
	qureauUsersApplicationsTable,
	qureauUsersByApplicationIdUsername,
	qureauUsersByEmail,
	qureauUsersByProviderResolvedId,
	qureauUsersByTokenId,
	qureauUsersByUserRegistrationId,
	qureauUsersByUsername,
	qureauUsersCredentialsTable,
	qureauUsersSearchIndex,
	qureauUsersTable,
} from "./repository/QureauUsersTable.mjs";
import { QureauUserCredentialRepository } from "./repository/users/QureauUserRepository.Credential.mjs";
import { QureauUserRegistrationRepository } from "./repository/users/QureauUserRepository.Registration.mjs";
import { QureauUserTokenRepository } from "./repository/users/QureauUserRepository.Token.mjs";
import { QureauUserRepository } from "./repository/users/QureauUserRepository.mjs";
import { QureauRegistration } from "./service/QureauRegistration.mjs";
import { QureauTokens } from "./service/QureauToken.mjs";
import { QureauUser } from "./service/QureauUser.mjs";

// https://gate.platform:10000/oauth2/anonymous?response_type=code&client_id=test&redirect_uri=/oauth2/redirect&scope=openid
export type QureauVariables = {
	Qureau: {
		login: string;
		errorUri: string;
	};
	Query: {
		authorize: (
			query: Record<
				string,
				string[] | string | undefined | ParsedFormValue | ParsedFormValue[]
			>,
		) => ReturnType<
			ReturnType<typeof AuthorizeQueryParamsZod>["safeParseAsync"]
		>;
		token: (
			query: Record<
				string,
				string[] | string | undefined | ParsedFormValue | ParsedFormValue[]
			>,
		) => ReturnType<ReturnType<typeof TokenQueryParamsZod>["safeParseAsync"]>;
	};
	Jwt: ReturnType<typeof QureauJwt>;
	User: QureauUser;
	Registration: QureauRegistration;
	Tokens: QureauTokens;
};

export type OauthEnvironment = {
	/**
	 * Initial redirect path from /oauth2/authorize. Required to be relative
	 * @default `/oauth2/anonymous/`
	 */
	OAUTH_IDP_LOGIN_PATH?: string;
	/**
	 * Error redirect path from oauth2 endpoints. Required to be relative
	 * @default `/oauth2/warn/`
	 */
	OAUTH_IDP_ERROR_PATH?: string;
};

const {
	OAUTH_IDP_LOGIN_PATH = "/oauth2/anonymous/",
	OAUTH_IDP_ERROR_PATH = "/oauth2/warn/",
}: OauthEnvironment = env;

const factory = createFactory<
	HttpMiddleware & {
		Variables: QureauVariables;
	}
>({
	initApp(app) {
		let authorize: QureauVariables["Query"]["authorize"] | undefined;
		let token: QureauVariables["Query"]["token"] | undefined;
		let qureauJwt: QureauJwts | undefined;

		const QureauUsersTable = qureauUsersTable;
		const QureauUserTokensTable = qureauUserTokensTable;

		const qureauUserRepository: QureauUserRepository = new QureauUserRepository(
			QureauUsersTable,
			qureauUsersByApplicationIdUsername,
			qureauUsersByUsername,
			qureauUsersByEmail,
			qureauUsersByProviderResolvedId,
			qureauUsersByTokenId,
			qureauUsersByUserRegistrationId,
			qureauUsersSearchIndex,
		);
		const qureauUserTokenRepository: QureauUserTokenRepository =
			new QureauUserTokenRepository(QureauUserTokensTable);
		const qureauUserCredentialRepository: QureauUserCredentialRepository =
			new QureauUserCredentialRepository();
		const qureauUserRegistrationRepository: QureauUserRegistrationRepository =
			new QureauUserRegistrationRepository(
				ulidKeygen,
				qureauUsersApplicationsTable,
				qureauUserRepository,
				qureauUserTokenRepository,
				qureauUserCredentialRepository,
			);

		const qureauUserService: QureauUser = new QureauUser(qureauUserRepository);
		let qureauRegistrationService: QureauRegistration | undefined;
		let qureauTokenService: QureauTokens | undefined;

		const qureau = {
			login: OAUTH_IDP_LOGIN_PATH,
			errorUri: OAUTH_IDP_ERROR_PATH,
		} as const;

		app.use(async function QureauService(c, next) {
			c.set("Qureau", qureau);

			if (!authorize || !token) {
				const queryConfiguration: AuthorizeQueryConfiguration = {
					accessType: ["offline"],
					approvalPrompt: ["auto"],
					codeChallengeMethod: ["plain", "S256"],
					prompt: ["none", "login", "consent", "select_account"],
					subjectTypes: c.var.OauthConfiguration.subjectTypes,
					clients: c.var.OauthClients,
					responseTypes: [...c.var.OauthConfiguration.responseTypes],
					scopes: c.var.OauthConfiguration.scopes,
				};
				const authorizeQuery = AuthorizeQueryParamsZod(
					queryConfiguration,
					c.var.OauthConfiguration,
					c.var.JwtVerification,
				);
				const tokenQuery = TokenQueryParamsZod(authorizeQuery);
				authorize = async (query) => {
					return authorizeQuery.safeParseAsync(query);
				};
				token = async (query) => {
					return tokenQuery.safeParseAsync(query);
				};
			}
			c.set("Query", {
				authorize,
				token,
			});

			if (!qureauJwt) {
				qureauJwt = QureauJwt({
					issuer: c.var.OauthConfiguration.issuer,
					jwtSignature: c.var.JwtSignature,
				});
			}

			c.set("Jwt", qureauJwt);
			c.set("User", qureauUserService);
			if (!qureauRegistrationService) {
				qureauRegistrationService = new QureauRegistration(
					qureauJwt,
					cuidKeygen,
					qureauUserRegistrationRepository,
				);
			}
			c.set("Registration", qureauRegistrationService);

			if (!qureauTokenService) {
				qureauTokenService = new QureauTokens(
					qureauJwt,
					qureauUserTokenRepository,
					// qureauTokenByTenant,
				);
			}
			c.set("Tokens", qureauTokenService);

			await next();
		});
	},
});

export const Qureau = () => {
	return factory;
};

export const version = {
	response: QureauResponseVersionEnum.QUREAU_R_LATEST,
	qureau: QureauVersionEnum.QUREAU_V_V1,
} as const satisfies QureauResponse["version"];

export const QureauAuthorizationEndpoint = "Login/Oauth2";
export const QureauEndSessionEndpoint = "Login/Session/Close";
export const QureauRevokeEndpoint = "Login/Session/Revoke";
export const QureauTokenEndpoint = "Login/Session/Token";
export const QureauUserinfoEndpoint = "Login/Session/Userinfo";
