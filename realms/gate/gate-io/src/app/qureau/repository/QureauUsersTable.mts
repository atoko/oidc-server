import { inspect } from "node:util";
import type { ITable } from "@levicape/spork/server/client/table/ITable";
import { MemoryTable } from "@levicape/spork/server/client/table/MemoryTable";
import { DynamoTable } from "@levicape/spork/server/client/table/aws/DynamoTable";
import { PostgresTable } from "@levicape/spork/server/client/table/postgres/PostgresTable";
import { env } from "std-env";
import { QureauDatabaseUsersTable } from "../../../_protocols/qureau/tsjson/table/user/table.user._.js";
import {
	QureauDatabaseTable,
	qureauDatabaseTableToJSON,
} from "../../../_protocols/qureau/tsnode/table/table._._.js";
import { QureauContext } from "../QureauContext.mjs";
import type { QureauUserApplicationRow } from "./users/user/QureauUserRow.Application.mjs";
import {
	type QureauUserTokenKey,
	QureauUserTokenRow,
} from "./users/user/QureauUserRow.Token.mjs";
import {
	type QureauUserKey,
	QureauUserRow,
} from "./users/user/QureauUserRow.mjs";
import type { QureauUserCredentialRow } from "./users/user/QureauUserRow.Credential.mjs";

const { users } = QureauContext.fromEnvironmentVariables();
let usersTable: ITable<QureauUserRow, QureauUserKey> | undefined;
let userTokensTable: ITable<QureauUserTokenRow, QureauUserTokenKey> | undefined;
env.AWS_REGION ||
	console.warn(
		inspect(
			{
				qureauUsersTable: {
					[QureauContext.QUREAU_DATABASE__NAME]: {
						users: {
							...users,
							writer: undefined,
							reader: undefined,
						},
						usersTable,
					},
				},
				now: Date.now(),
			},
			{ depth: null, colors: true, compact: false },
		),
	);

if (users !== undefined) {
	const { service, namespace } = users;

	if (service.startsWith("postgresql://")) {
		const { postgres } = users;
		PostgresTable.SSL_MODE = "";
		usersTable = (await PostgresTable.for(
			{
				master: postgres?.master ?? "",
				replica: postgres?.replica ?? postgres?.master ?? "",
				databaseName: postgres?.database ?? "qureau",
				schemaName: postgres?.schema ?? "public",
				tableName: qureauDatabaseTableToJSON(QureauDatabaseTable.qureau_users),
				writer: {
					username: postgres?.writer.username ?? "postgres",
					password: postgres?.writer.password ?? "",
				},
				reader: {
					username: postgres?.reader.username ?? "postgres",
					password: postgres?.reader.password ?? "",
				},
			},
			QureauUserRow.getKey,
		)) as unknown as ITable<QureauUserRow<`qureau@${string}`>, QureauUserKey>;

		userTokensTable = (await PostgresTable.for(
			{
				master: postgres?.master ?? "",
				replica: postgres?.replica ?? postgres?.master ?? "",
				databaseName: postgres?.database ?? "qureau",
				schemaName: postgres?.schema ?? "public",
				tableName: qureauDatabaseTableToJSON(QureauDatabaseTable.qureau_users),
				writer: {
					username: postgres?.writer.username ?? "postgres",
					password: postgres?.writer.password ?? "",
				},
				reader: {
					username: postgres?.reader.username ?? "postgres",
					password: postgres?.reader.password ?? "",
				},
			},
			QureauUserTokenRow.getKey,
		)) as unknown as ITable<QureauUserTokenRow, QureauUserTokenKey>;
	}

	if (service.startsWith("dynamodb://")) {
		const [, tableName] = service.split("://");
		usersTable = new DynamoTable(
			tableName ?? "",
			namespace,
			QureauUserRow.getKey,
		);
	}
}

export const qureauUsersTable =
	usersTable ??
	new MemoryTable(QureauUserRow.getKey, ({ pk, sk }) => ({
		pk,
		sk,
	}));

export const qureauUserTokensTable = qureauUsersTable as ITable<
	QureauUserTokenRow,
	QureauUserTokenKey
>;

export const qureauUsersApplicationsTable = qureauUsersTable as ITable<
	QureauUserApplicationRow,
	QureauUserKey
>;

export const qureauUsersCredentialsTable = qureauUsersTable as unknown as ITable<
	QureauUserCredentialRow,
	QureauUserKey
>;

export const qureauUsersByTenant = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi1,
);

export const qureauUsersByApplicationIdUsername = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi7,
);

export const qureauUsersByUsername = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi2,
);

export const qureauUsersByEmail = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi3,
);

export const qureauUsersByTokenId = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi5,
);

export const qureauUsersByProviderResolvedId = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi4,
);

export const qureauUsersByUserRegistrationId = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi6,
);

export const qureauUsersSearchIndex = qureauUsersTable.forGsi(
	users?.gsi?.GSI1 ?? QureauDatabaseUsersTable.qureau_users_by_gsi6,
);
