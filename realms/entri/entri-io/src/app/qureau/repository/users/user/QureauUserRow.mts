import { createHash } from "node:crypto";
import type { IRow } from "@levicape/spork/server/client/table/ITable";
import type { QureauTableUsersEntity } from "../../../../../_protocols/qureau/tsjson/table/user/table.user._.js";
import { User } from "../../../../../_protocols/qureau/tsnode/domain/user/user._._.js";
import { QureauDomainablePrincipalBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.principal.blob.js";
import { QureauDomainableRequestBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.request.blob.js";
import { QureauDomainableScryptBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.scrypt.blob.js";
import {
	QureauProtocolVersionEnum,
	QureauVersionEnum,
} from "../../../../../_protocols/qureau/tsnode/service/version.js";
// import {
// 	qureauZugZugv1,
// 	qureauZugZugv1ToJSON,
// } from "#protocols/qureau/tsnode/domain/scrypt/scrypt._._._.key";
import type { QureauUsersApplicationEntity } from "./QureauUserRow.Application.mjs";
import type { QureauUsersTokenEntity } from "./QureauUserRow.Token.mjs";

const RING_SIZE = 504;

type QureauUserId = string;
type QureauTableId = `qureau@${QureauUserId}`;
export type QureauApplicationId = "tsk" | "qru" | "uwu";
export type QureauUserEntity = `&User!;`;

export type QureauUsersEntity =
	| QureauUserEntity
	| QureauUsersTokenEntity
	| QureauUsersApplicationEntity;
export type QureauUserKey = {
	pk: QureauTableId;
	sk: QureauUsersEntity;
};
export class QureauUserRow<Pk extends string = QureauTableId>
	implements IRow<QureauUserKey>, QureauTableUsersEntity
{
	pk: Pk;
	sk: QureauUsersEntity = "&User!;";

	gsis_pk___shard: number;
	gsip_pk___perimeter: number;
	gsi1_pk___tenant: string;
	gsi1_sk___pk: string;
	gsi2_pk__pk___username: string;
	gsi7_pk__pk___applicationid__username?: string;
	gsi3_pk__pk___pk__applicationid__email?: string;
	gsi4_pk__pk___pk__applicationid__providerresolvedid?: string;
	gsi5_pk__pk___pk__applicationid__tokenid?: string;
	gsi6_pk__pk___pk__applicationid__userregistrationid?: string;

	jsondata: string;
	binpb: Buffer;
	protocol: QureauProtocolVersionEnum;
	application: QureauVersionEnum;
	created: string;
	updated?: string;
	deleted?: string;
	monotonic: number;

	expiry_unix_second?: number;
	owner_blob: string;
	genesis_blob: string;
	signature_blob: string;
	signature_salt: Buffer;
	principal_blob: string;
	request_blob: string;
	scrypt_blob: string;
	owner_pb: Buffer;
	genesis_pb: Buffer;
	signature_pb: Buffer;
	principal_pb: Buffer;
	request_pb: Buffer;
	scrypt_pb: Buffer;

	constructor(
		userId: string,
		user: User,
		nowIsoString: string,
		principalBlob: QureauDomainablePrincipalBlob,
		requestBlob: QureauDomainableRequestBlob,
		scryptBlob: QureauDomainableScryptBlob,
	) {
		this.pk = `qureau@${userId}` as Pk;
		this.sk = "&User!;";
		this.gsis_pk___shard =
			createHash("md5").update(userId).digest().readUInt32LE(0) % RING_SIZE;
		this.gsip_pk___perimeter = (Math.random() * RING_SIZE ** 2) % RING_SIZE;

		const { username } = user;
		// biome-ignore lint/style/noNonNullAssertion:
		this.gsi1_pk___tenant = principalBlob.principalId!;
		this.gsi1_sk___pk = this.sk;
		this.gsi2_pk__pk___username = `@${principalBlob.principalId}*user!${username};`;

		this.jsondata = JSON.stringify(user);
		this.protocol = QureauProtocolVersionEnum.QUREAU_P_LATEST;
		this.application = QureauVersionEnum.QUREAU_V_V1;
		this.created = nowIsoString;
		this.monotonic = 1;

		const jsonPrincipalBlob = JSON.stringify(principalBlob);
		const jsonRequestBlob = JSON.stringify(requestBlob);
		const jsonScryptBlob = JSON.stringify(scryptBlob);

		this.owner_blob = jsonPrincipalBlob;
		this.genesis_blob = jsonRequestBlob;
		this.principal_blob = jsonPrincipalBlob;
		this.request_blob = jsonRequestBlob;
		this.scrypt_blob = jsonScryptBlob;
		this.signature_blob = jsonScryptBlob;
		this.signature_salt = Buffer.from(
			(
				(((Math.random() * Number.MAX_SAFE_INTEGER) / 8) %
					Number.MAX_SAFE_INTEGER) /
				32
			)
				.toString(36)
				.substring(2),
		);

		const principal_pb =
			QureauDomainablePrincipalBlob.encode(principalBlob).finish();
		const request_pb = QureauDomainableRequestBlob.encode(requestBlob).finish();
		const scrypt_pb = QureauDomainableScryptBlob.encode(scryptBlob).finish();

		this.binpb = Buffer.from(User.encode(user).finish());
		this.owner_pb = Buffer.from(principal_pb);
		this.principal_pb = Buffer.from(principal_pb);
		this.genesis_pb = Buffer.from(request_pb);
		this.request_pb = Buffer.from(request_pb);
		this.scrypt_pb = Buffer.from(scrypt_pb);
		this.signature_pb = Buffer.from(scrypt_pb);
	}

	static getKey(partitionKey: string): QureauUserKey {
		const [userId] = partitionKey.split("-");
		return {
			pk: `qureau@${userId}`,
			// TODO: Do I have an enum for this?
			sk: "&User!;",
		};
	}

	static rowToEntity(row: QureauUserRow): QureauUserRow {
		const hasBuffers = typeof row.binpb !== "string";
		const objectsAreHydrated = typeof row.jsondata !== "string";
		const rowBuffers = {
			binpb: row.binpb,
			owner_pb: row.owner_pb,
			principal_pb: row.principal_pb,
			genesis_pb: row.genesis_pb,
			request_pb: row.request_pb,
		};
		// biome-ignore lint/suspicious/noExplicitAny:
		const rowBlobs = row as unknown as Record<string, any>;
		if (hasBuffers) {
			row.binpb = Buffer.alloc(0);
			row.owner_pb = Buffer.alloc(0);
			row.principal_pb = Buffer.alloc(0);
			row.genesis_pb = Buffer.alloc(0);
			row.request_pb = Buffer.alloc(0);
		}
		const rowEntity = { ...row };
		if (hasBuffers) {
			rowEntity.binpb = rowBuffers.binpb;
			rowEntity.owner_pb = rowBuffers.owner_pb;
			rowEntity.principal_pb = rowBuffers.principal_pb;
			rowEntity.genesis_pb = rowBuffers.genesis_pb;
			rowEntity.request_pb = rowBuffers.request_pb;
		}

		if (objectsAreHydrated) {
			rowEntity.jsondata = rowBlobs.jsondata;
			rowEntity.principal_blob = rowBlobs.principal_blob;
			rowEntity.genesis_blob = rowBlobs.genesis_blob;
			rowEntity.request_blob = rowBlobs.request_blob;
			rowEntity.owner_blob = rowBlobs.owner_blob;
		}

		return rowEntity;
	}

	static toData(row: QureauUserRow): User {
		const [_, pk] = row.pk.split("@");
		const [userId] = (pk ?? "").split("&");

		try {
			const user = User.decode(row.binpb);

			return User.fromPartial({
				...user,
				id: `${userId}`,
			});
		} catch (e) {}

		if (!row.jsondata || row.jsondata === "") {
			console.error({
				QureauUserRow: {
					toData: {
						error: "No data",
						row: JSON.stringify(row),
					},
				},
			});
			throw new Error("No data");
		}

		const jsondata =
			typeof row.jsondata === "string"
				? JSON.parse(row.jsondata)
				: row.jsondata;

		return User.fromPartial({
			...jsondata,
			id: `${userId}`,
		});
	}
}
