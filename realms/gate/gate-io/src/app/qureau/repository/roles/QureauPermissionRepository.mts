import type { ITable } from "@levicape/spork/server/client/table/ITable";
import { QureauPermissionRow, type QureauPermissionKey } from "./permission/QureauPermissionRow.mjs";

export class QureauPermissionRepository {
    constructor(
        private readonly permissions: ITable<QureauPermissionRow, QureauPermissionKey>,
    ) {}

    getPermissionById = async (
        id: string,
    ): Promise<QureauPermissionRow | undefined> => {
        const { pk, sk } = QureauPermissionRow.getKey(id);
        return await this.permissions.getById(pk, sk);
    };
}
