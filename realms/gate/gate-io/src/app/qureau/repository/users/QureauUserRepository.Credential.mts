import { scryptSync } from "node:crypto";
import type { Credential } from "../../../../_protocols/qureau/tsnode/domain/credential/credential._._.js";
import type { QureauRepositoryProps } from "./QureauUserRepository.mjs";
import { QureauUserCredentialRow } from "./user/QureauUserRow.Credential.mjs";

export class QureauUserCredentialRepository {
	constructor() {}

	credentialRowForCredential = async (
		credential: Credential,
		props: QureauRepositoryProps,
	): Promise<QureauUserCredentialRow> => {
		const nowunix = Date.now();
		const nowiso = new Date(nowunix).toISOString();

		if (credential.userId === undefined) {
			throw new Error("Credential must have a userId")
		}

		const row = new QureauUserCredentialRow(
			credential.userId,
			credential,
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

	createPasswordForUser = async (
		userId: string,
		password: string,
		props: QureauRepositoryProps,
	): Promise<QureauUserCredentialRow> => {
		const hashed = scryptSync(password, userId, 64);
		const credential = {
			userId: userId,
			providerId: "password",
			credential: hashed.toString('hex'),
		};
		const credentialrow = (await this.credentialRowForCredential(
			credential,
			props,
		)) as QureauUserCredentialRow;

		return credentialrow;
	};
}
