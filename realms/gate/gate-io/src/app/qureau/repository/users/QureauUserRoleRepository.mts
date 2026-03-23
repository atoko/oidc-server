import type { ITable } from "@levicape/spork/server/client/table/ITable";
import { QureauUserRoleRow, type QureauUserRoleKey } from "./user-role/QureauUserRoleRow.mjs";

export class QureauUserRoleRepository {
    constructor(
        private readonly userRoles: ITable<QureauUserRoleRow, QureauUserRoleKey>,
    ) {}

    getRolesForUser = async (
        userId: string,
    ): Promise<QureauUserRoleRow[]> => {
        const pk = `user@${userId}`;
        const generator = await this.userRoles.readPartition(pk, "pk", {});
        const rows: QureauUserRoleRow[] = [];
        for await (const row of generator) {
            rows.push(row);
        }
        return rows;
    };
}
