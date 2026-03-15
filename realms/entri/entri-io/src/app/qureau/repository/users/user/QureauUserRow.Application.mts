import { createHash } from "node:crypto";
import type { IRow } from "@levicape/spork/server/client/table/ITable";
// import {
// 	qureauZugZugv1,
// 	qureauZugZugv1ToJSON,
// } from "#protocols/qureau/tsnode/domain/scrypt/scrypt._._._.key";
import type { User } from "../../../../../_protocols/qureau/tsnode/domain/user/user._._.js";
import { UserRegistration } from "../../../../../_protocols/qureau/tsnode/domain/user/user._._.registration._._.js";
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
export type QureauUsersApplicationEntity = `&User!App&${QureauApplicationId};`;
export type QureauUserApplicationKey = {
	pk: QureauTableId;
	sk: QureauUsersApplicationEntity;
};
export class QureauUserApplicationRow<Pk extends string = QureauTableId>
	implements IRow<QureauUserApplicationKey>, QureauTableUsersEntity
{
	pk: Pk;
	sk: QureauUsersApplicationEntity;

	gsis_pk___shard: number;
	gsip_pk___perimeter: number;
	gsi1_pk___tenant: string;
	gsi1_sk___pk: string;
	gsi2_pk__pk___username?: string;
	gsi7_pk__pk___applicationid__username: string;
	gsi3_pk__pk___pk__applicationid__email: string;
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
		applicationId: "tsk" | "qru" | "uwu",
		userId: string,
		user: User,
		registration: UserRegistration,
		nowIsoString: string,
		principalBlob: QureauDomainablePrincipalBlob,
		requestBlob: QureauDomainableRequestBlob,
		scryptBlob: QureauDomainableScryptBlob,
	) {
		this.pk = `qureau@${userId}` as Pk;
		this.sk = `&User!App&${applicationId};`;

		this.gsis_pk___shard =
			createHash("md5").update(userId).digest().readUInt32LE(0) % RING_SIZE;
		this.gsip_pk___perimeter = (Math.random() * RING_SIZE ** 2) % RING_SIZE;

		const { username } = user;

		this.gsi1_pk___tenant = userId;
		this.gsi1_sk___pk = this.sk;
		this.gsi3_pk__pk___pk__applicationid__email =
			user.email !== undefined
				? `@${applicationId}*User!${user.email};`
				: (undefined as unknown as string);
		this.gsi7_pk__pk___applicationid__username = `@${applicationId}*User!${username};`;

		this.jsondata = JSON.stringify(registration);
		this.protocol = QureauProtocolVersionEnum.QUREAU_P_LATEST;
		this.application = QureauVersionEnum.QUREAU_V_V1;
		this.created = nowIsoString;
		this.monotonic = 1;

		const jsonPrincipalBlob = JSON.stringify(principalBlob);
		this.owner_blob = jsonPrincipalBlob;
		this.principal_blob = jsonPrincipalBlob;

		const jsonRequestBlob = JSON.stringify(requestBlob);
		this.genesis_blob = jsonRequestBlob;
		this.request_blob = jsonRequestBlob;

		const jsonScryptBlob = JSON.stringify(scryptBlob);
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

		this.binpb = Buffer.from(UserRegistration.encode(registration).finish());
		this.owner_pb = Buffer.from(principal_pb);
		this.principal_pb = Buffer.from(principal_pb);
		this.genesis_pb = Buffer.from(request_pb);
		this.request_pb = Buffer.from(request_pb);
		this.scrypt_pb = Buffer.from(scrypt_pb);
		this.signature_pb = Buffer.from(scrypt_pb);
	}

	// completeUserKey = `${userId}-${applicationId}`;
	static getKey(partitionKey: string): QureauUserApplicationKey {
		const [userId, applicationId] = partitionKey.split("-");
		return {
			pk: `qureau@${userId}`,
			sk: `&User!App&${(applicationId as QureauApplicationId) ?? "uwu"};`,
		};
	}

	// static rowToEntity(row: TarrasqTaskRow): TarrasqTaskRow {
	// const hasBuffers = typeof row.binpb !== "string";
	// const objectsAreHydrated = typeof row.jsondata !== "string";
	// const rowBuffers = {
	// 	binpb: row.binpb,
	// 	owner_pb: row.owner_pb,
	// 	principal_pb: row.principal_pb,
	// 	genesis_pb: row.genesis_pb,
	// 	request_pb: row.request_pb,
	// };
	// // biome-ignore lint/suspicious/noExplicitAny:
	// const rowBlobs = row as unknown as Record<string, any>;
	// if (hasBuffers) {
	// 	row.binpb = Buffer.alloc(0);
	// 	row.owner_pb = Buffer.alloc(0);
	// 	row.principal_pb = Buffer.alloc(0);
	// 	row.genesis_pb = Buffer.alloc(0);
	// 	row.request_pb = Buffer.alloc(0);
	// }
	// const rowEntity = { ...row };
	// if (hasBuffers) {
	// 	rowEntity.binpb = rowBuffers.binpb;
	// 	rowEntity.owner_pb = rowBuffers.owner_pb;
	// 	rowEntity.principal_pb = rowBuffers.principal_pb;
	// 	rowEntity.genesis_pb = rowBuffers.genesis_pb;
	// 	rowEntity.request_pb = rowBuffers.request_pb;
	// }

	// if (objectsAreHydrated) {
	// 	rowEntity.jsondata = rowBlobs.jsondata;
	// 	rowEntity.principal_blob = rowBlobs.principal_blob;
	// 	rowEntity.genesis_blob = rowBlobs.genesis_blob;
	// 	rowEntity.request_blob = rowBlobs.request_blob;
	// 	rowEntity.owner_blob = rowBlobs.owner_blob;
	// }

	// return rowEntity;
	// }

	static toData(row: QureauUserApplicationRow): UserRegistration {
		let applicationId: QureauApplicationId | "uwu";
		const [_, applicationStanza] = row.sk.split("!");
		if (applicationStanza?.startsWith("App&")) {
			applicationId = applicationStanza.split("&")[1] as QureauApplicationId;
		} else {
			applicationId = "uwu";
		}

		try {
			const userregistration = UserRegistration.decode(row.binpb);

			return UserRegistration.fromPartial({
				...userregistration,
				applicationId: applicationId as QureauApplicationId,
			});
		} catch (e) {}

		if (!row.jsondata || row.jsondata === "") {
			console.error({
				QureauUserApplicationRow: {
					toData: {
						error: "No data",
					},
				},
			});
			throw new Error("No data");
		}

		const jsondata =
			typeof row.jsondata === "string"
				? JSON.parse(row.jsondata)
				: row.jsondata;

		return UserRegistration.fromPartial({
			...jsondata,
			applicationId: applicationId as QureauApplicationId,
		});
	}
}
