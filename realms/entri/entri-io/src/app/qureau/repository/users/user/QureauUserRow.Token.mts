import { createHash } from "node:crypto";
import type { IRow } from "@levicape/spork/server/client/table/ITable";
// import {
// 	qureauZugZugv1,
// 	qureauZugZugv1ToJSON,
// } from "#protocols/qureau/tsnode/domain/scrypt/scrypt._._._.key";
import { RefreshToken } from "../../../../../_protocols/qureau/tsnode/domain/token/token._._.js";
import { QureauDomainablePrincipalBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.principal.blob.js";
import { QureauDomainableRequestBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.request.blob.js";
import { QureauDomainableScryptBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.scrypt.blob.js";
import {
	QureauProtocolVersionEnum,
	QureauVersionEnum,
} from "../../../../../_protocols/qureau/tsnode/service/version.js";
import type { QureauTableUsersEntity } from "../../../../../_protocols/qureau/tsnode/table/user/table.user._.js";
import type { QureauApplicationId } from "./QureauUserRow.mjs";

const RING_SIZE = 504;

type QureauUserId = string;
type QureauTableId = `qureau@${QureauUserId}`;
export type QureauTokenId = string;
export type QureauUsersTokenEntity =
	`&User!App&${QureauApplicationId}!Token&${QureauTokenId};`;
export type QureauUserTokenKey = {
	pk: QureauTableId;
	sk: QureauUsersTokenEntity;
};
export class QureauUserTokenRow<Pk extends string = QureauTableId>
	implements IRow<QureauUserTokenKey>, QureauTableUsersEntity
{
	pk: Pk;
	sk: QureauUsersTokenEntity;

	gsis_pk___shard: number;
	gsip_pk___perimeter: number;
	gsi1_pk___tenant: string;
	gsi1_sk___pk: string;
	gsi2_pk__pk___username?: string;
	gsi7_pk__pk___applicationid__username?: string;
	gsi3_pk__pk___pk__applicationid__email?: string;
	gsi4_pk__pk___pk__applicationid__providerresolvedid?: string;
	gsi5_pk__pk___pk__applicationid__tokenid: string;
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
		applicationId: "tsk" | "qru" | "uwu",
		userId: string,
		tokenId: string,
		token: RefreshToken,
		nowIsoString: string,
		principalBlob: QureauDomainablePrincipalBlob,
		requestBlob: QureauDomainableRequestBlob,
		scryptBlob: QureauDomainableScryptBlob,
		username?: string,
	) {
		this.pk = `qureau@${userId}` as Pk;
		this.sk = `&User!App&${applicationId}!Token&${tokenId};`;
		this.gsis_pk___shard =
			createHash("md5").update(userId).digest().readUInt32LE(0) % RING_SIZE;
		this.gsip_pk___perimeter = (Math.random() * RING_SIZE ** 2) % RING_SIZE;

		this.gsi1_pk___tenant = userId;
		this.gsi1_sk___pk = this.sk;
		this.gsi5_pk__pk___pk__applicationid__tokenid = `@${applicationId}*User!${tokenId};`;
		if (username) {
			this.gsi2_pk__pk___username = `@${username}*user!${userId};`;
			this.gsi7_pk__pk___applicationid__username = `@${applicationId}*user!${username};`;
		}

		this.jsondata = JSON.stringify(token);
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

		this.binpb = Buffer.from(RefreshToken.encode(token).finish());
		this.owner_pb = Buffer.from(principal_pb);
		this.principal_pb = Buffer.from(principal_pb);
		this.genesis_pb = Buffer.from(request_pb);
		this.request_pb = Buffer.from(request_pb);
		this.scrypt_pb = Buffer.from(scrypt_pb);
		this.signature_pb = Buffer.from(scrypt_pb);
	}

	// completeUserKey = `${userId}-${applicationId}-${tokenId}`;
	static getKey(partitionKey: string): QureauUserTokenKey {
		const [userId, applicationId, tokenId] = partitionKey.split("-");
		return {
			pk: `qureau@${userId}`,
			sk: `&User!App&${(applicationId as QureauApplicationId) ?? "uwu"}!Token&${tokenId ?? "uwu"};`,
		};
	}

	static toData(row: QureauUserTokenRow): RefreshToken {
		const [_q, pk] = row.pk.split("@");
		const [userId] = (pk ?? "").split("&");

		let applicationId: QureauApplicationId | "uwu";
		let tokenId: string | "uwu";
		const [_, applicationStanza, tokenStanza] = row.sk.split("!");
		if (applicationStanza?.startsWith("App&")) {
			applicationId =
				(applicationStanza.split("&")[1] as QureauApplicationId) ?? "uwu";
		} else {
			applicationId = "uwu";
		}

		if (tokenStanza?.startsWith("Token&")) {
			tokenId = tokenStanza.split("&")[1] ?? "uwu";
		} else {
			tokenId = "uwu";
		}

		// TODO: Confirm
		try {
			const refreshtoken = RefreshToken.decode(Uint8Array.from(row.binpb));

			return RefreshToken.fromPartial({
				...refreshtoken,
				applicationId: applicationId as QureauApplicationId,
			});
		} catch (e) {}

		if (!row.jsondata || row.jsondata === "") {
			console.error({
				QureauUserTokenRow: {
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

		return RefreshToken.fromPartial({
			...jsondata,
			userId: `${userId}|`,
			applicationId: applicationId as QureauApplicationId,
			tokenId: tokenId,
			id: `${userId}-${applicationId}-${tokenId}`,
		});
	}
}
