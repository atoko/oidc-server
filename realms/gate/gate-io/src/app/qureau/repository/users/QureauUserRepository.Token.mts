import type { ITable } from "@levicape/spork/server/client/table/ITable";
import type { RefreshToken } from "../../../../_protocols/qureau/tsnode/domain/token/token._._.js";
import type { QureauRepositoryProps } from "./QureauUserRepository.mjs";
import {
	type QureauUserTokenKey,
	QureauUserTokenRow,
} from "./user/QureauUserRow.Token.mjs";

export class QureauUserTokenRepository {
	constructor(
		private readonly tokens: ITable<QureauUserTokenRow, QureauUserTokenKey>,
	) {}
	tokenRowForRefreshToken = async (
		refreshToken: RefreshToken & { userId: string; id: string },
		props: QureauRepositoryProps,
	): Promise<QureauUserTokenRow> => {
		const nowunix = Date.now();
		const nowiso = new Date(nowunix).toISOString();

		const row = new QureauUserTokenRow(
			(refreshToken.applicationId as "uwu") ?? "uwu",
			refreshToken.userId,
			refreshToken.id,
			refreshToken,
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

	getByUserIdApplicationIdTokenId = async (
		userId: string,
		applicationId: Parameters<typeof QureauUserTokenRow.sk>[0],
		tokenId: Parameters<typeof QureauUserTokenRow.sk>[1],
	): Promise<QureauUserTokenRow | undefined> => {
		const pk = userId;
		const sk = QureauUserTokenRow.sk(applicationId, tokenId);

		return await this.tokens.getById(pk, sk);
	};
}
