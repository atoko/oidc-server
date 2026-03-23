import type { ITable } from "@levicape/spork/server/client/table/ITable";
import { QureauRoleRow, type QureauRoleKey } from "./role/QureauRoleRow.mjs";

export class QureauRoleRepository {
    constructor(
        private readonly roles: ITable<QureauRoleRow, QureauRoleKey>,
    ) {}

    getRoleById = async (
        id: string,
    ): Promise<QureauRoleRow | undefined> => {
        const { pk, sk } = QureauRoleRow.getKey(id);
        return await this.roles.getById(pk, sk);
    };
}
