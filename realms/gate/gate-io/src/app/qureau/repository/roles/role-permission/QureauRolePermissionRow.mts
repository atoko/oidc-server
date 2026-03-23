import { type IRow } from "@levicape/spork/server/client/table/ITable";

export type QureauRolePermissionEntity = `&RolePermission!;`;

export type QureauRolePermissionKey = {
	pk: string;
	sk: `${QureauRolePermissionEntity}@${string}`;
};

export class QureauRolePermissionRow<Pk extends string = string>
	implements IRow<QureauRolePermissionKey>
{
	pk: Pk;
	sk: QureauRolePermissionKey['sk'] = "&RolePermission!;@";
    role_id: string;
    permission_id: string;

	constructor(
		role_id: string,
		permission_id: string,
	) {
		this.pk = `role@${role_id}` as Pk;
		this.sk = `&RolePermission!;@${permission_id}`;
        this.role_id = role_id;
        this.permission_id = permission_id;
	}

	static getKey(roleId: string, permissionId: string): QureauRolePermissionKey {
		return {
			pk: `role@${roleId}`,
			sk: `&RolePermission!;@${permissionId}`,
		};
	}
}
