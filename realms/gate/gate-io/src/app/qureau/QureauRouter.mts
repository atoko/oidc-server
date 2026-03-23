import { withQuery } from "ufo";
import { prettifyError } from "zod";
import { QureauResponse } from "../../_protocols/qureau/tsnode/service/qureau._.js";
import {
	Qureau,
	QureauAuthorizationEndpoint,
	QureauEndSessionEndpoint,
	QureauRevokeEndpoint,
	QureauTokenEndpoint,
	QureauUserinfoEndpoint,
	version,
} from "./Qureau.mjs";
import { QureauLoginHandler } from "./controller/login/QureauLoginHandler.mjs";
import { QureauRegistrationAnonymousHandler } from "./controller/registrations/QureauRegistrationAnonymousHandler.mjs";
import { QureauRegistrationHandler } from "./controller/registrations/QureauRegistrationHandler.mjs";
import { QureauRegistrationPasswordHandler } from "./controller/registrations/QureauRegistrationPasswordHandler.mjs";
import { QureauTokensRefreshFromRefreshHandler } from "./controller/tokens/QureauTokensRefreshFromRefreshHandler.mjs";
import { QureauUsersPrincipalViewHandler } from "./controller/users/principal/QureauUsersPrincipalViewHandler.mjs";

export const QureauRouter = Qureau()
	.createApp()
	.get(QureauAuthorizationEndpoint, async (c) => {
		const { login, errorUri } = c.get("Qureau");
		const { data, error } = await c.var.Query.authorize(c.req.query());
		if (error) {
			return c.redirect(
				withQuery(errorUri, {
					error: "invalid_request",
					error_description: prettifyError(error),
				}),
			);
		}
		return c.redirect(withQuery(login, data));
	})
	.get(QureauEndSessionEndpoint, async (c) => {
		const { errorUri } = c.get("Qureau");
		const { error } = await c.var.Query.authorize(c.req.query());
		if (error) {
			return c.redirect(
				withQuery(errorUri, {
					error: "invalid_request",
					error_description: prettifyError(error),
				}),
			);
		}

		return c.redirect("/oauth2/logout/");
	})
	.post("Login/Anonymous", ...QureauRegistrationAnonymousHandler)
	.post("Login/Session", ...QureauLoginHandler)
	.post(QureauTokenEndpoint, ...QureauTokensRefreshFromRefreshHandler)
	.post(QureauRevokeEndpoint, ...QureauLoginHandler)
	.post(QureauUserinfoEndpoint, ...QureauUsersPrincipalViewHandler)
	.post("Users/Registration", ...QureauRegistrationHandler)
	.post("Users/Registration/Password", ...QureauRegistrationPasswordHandler);

export const QureauNotFound = Qureau().createHandlers(async (c) => {
	return c.json(
		QureauResponse.toJSON({
			error: {
				code: "UNPROCESSABLE_ENTITY",
				message: "Could not process the request",
				cause: undefined,
				validations: [],
			},
			version,
		}) as QureauResponse,
		409,
	);
});
