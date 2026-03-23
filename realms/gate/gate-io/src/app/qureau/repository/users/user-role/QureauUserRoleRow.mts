import { type IRow } from "@levicape/spork/server/client/table/ITable";

export type QureauUserRoleEntity = `&UserRole!;`;

export type QureauUserRoleKey = {
	pk: string;
	sk: `${QureauUserRoleEntity}@${string}`;
};

export class QureauUserRoleRow<Pk extends string = string>
	implements IRow<QureauUserRoleKey>
{
	pk: Pk;
	sk: QureauUserRoleKey['sk'] = "&UserRole!;@";
    user_pk: string;
    user_sk: string;
    role_id: string;

	constructor(
		user_pk: string,
		user_sk: string,
		role_id: string,
	) {
		this.pk = `user@${user_pk}` as Pk;
		this.sk = `&UserRole!;@${role_id}`;
        this.user_pk = user_pk;
        this.user_sk = user_sk;
        this.role_id = role_id;
	}

	static getKey(userId: string, roleId: string): QureauUserRoleKey {
		return {
			pk: `user@${userId}`,
			sk: `&UserRole!;@${roleId}`,
		};
	}
}
