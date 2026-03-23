import { type IRow } from "@levicape/spork/server/client/table/ITable";

export type QureauPermissionEntity = `&Permission!;`;

export type QureauPermissionKey = {
	pk: string;
	sk: QureauPermissionEntity;
};
export class QureauPermissionRow<Pk extends string = string>
	implements IRow<QureauPermissionKey>
{
	pk: Pk;
	sk: QureauPermissionEntity = "&Permission!;";
    id: string;
    name: string;
    resource: string;

	constructor(
		id: string,
		name: string,
        resource: string,
	) {
		this.pk = id as Pk;
		this.sk = "&Permission!;";
        this.id = id;
        this.name = name;
        this.resource = resource;
	}

	static getKey(partitionKey: string): QureauPermissionKey {
		const [id] = partitionKey.split("-");
		return {
			pk: `permission@${id}`,
			sk: "&Permission!;",
		};
	}
}
