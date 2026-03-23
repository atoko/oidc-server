import { createHash } from "node:crypto";
import type { IRow } from "@levicape/spork/server/client/table/ITable";
import type { Credential } from "../../../../../_protocols/qureau/tsnode/domain/credential/credential._._.js";
import type { QureauTableUsersEntity } from "../../../../../_protocols/qureau/tsjson/table/user/table.user._.js";
import { QureauDomainablePrincipalBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.principal.blob.js";
import { QureauDomainableRequestBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.request.blob.js";
import { QureauDomainableScryptBlob } from "../../../../../_protocols/qureau/tsnode/entity/entity._.scrypt.blob.js";
import {
	QureauProtocolVersionEnum,
	QureauVersionEnum,
} from "../../../../../_protocols/qureau/tsnode/service/version.js";
import type { QureauUserKey } from "./QureauUserRow.mjs";

const RING_SIZE = 504;

type QureauUserId = string;
type QureauTableId = `qureau@${QureauUserId}`;
export type QureauUserCredentialEntity = `&Credential!;${string}`;

export class QureauUserCredentialRow<Pk extends string = QureauTableId>
	implements IRow<QureauUserKey>, QureauTableUsersEntity
{
	pk: Pk;
	sk: QureauUserCredentialEntity = "&Credential!;";

	gsis_pk___shard: number;
	gsip_pk___perimeter: number;
	gsi1_pk___tenant: string;
	gsi1_sk___pk: string;

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
		credential: Credential,
		nowIsoString: string,
		principalBlob: QureauDomainablePrincipalBlob,
		requestBlob: QureauDomainableRequestBlob,
		scryptBlob: QureauDomainableScryptBlob,
	) {
		this.pk = `qureau@${userId}` as Pk;
		this.sk = `&Credential!;${credential.providerId}`;
		this.gsis_pk___shard =
			Math.round(createHash("md5").update(userId).digest().readUInt32LE(0) % RING_SIZE);
		this.gsip_pk___perimeter = Math.round((Math.random() * RING_SIZE ** 2) % RING_SIZE);

		// biome-ignore lint/style/noNonNullAssertion:
		this.gsi1_pk___tenant = principalBlob.principalId!;
		this.gsi1_sk___pk = this.sk;

		this.jsondata = JSON.stringify(credential);
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

		this.binpb = Buffer.from(new Uint8Array());
		this.owner_pb = Buffer.from(principal_pb);
		this.principal_pb = Buffer.from(principal_pb);
		this.genesis_pb = Buffer.from(request_pb);
		this.request_pb = Buffer.from(request_pb);
		this.scrypt_pb = Buffer.from(scrypt_pb);
		this.signature_pb = Buffer.from(scrypt_pb);
	}
}
