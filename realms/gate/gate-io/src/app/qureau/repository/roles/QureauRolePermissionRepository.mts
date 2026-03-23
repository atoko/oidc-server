import type { ITable } from "@levicape/spork/server/client/table/ITable";
import { QureauRolePermissionRow, type QureauRolePermissionKey } from "./role-permission/QureauRolePermissionRow.mjs";

export class QureauRolePermissionRepository {
    constructor(
        private readonly rolePermissions: ITable<QureauRolePermissionRow, QureauRolePermissionKey>,
    ) {}

    getPermissionsForRole = async (
        roleId: string,
    ): Promise<QureauRolePermissionRow[]> => {
        const pk = `role@${roleId}`;
        const generator = await this.rolePermissions.readPartition(pk, "pk", {});
        const rows: QureauRolePermissionRow[] = [];
        for await (const row of generator) {
            rows.push(row);
        }
        return rows;
    };
}
