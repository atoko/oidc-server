import { type IRow } from "@levicape/spork/server/client/table/ITable";

export type QureauRoleEntity = `&Role!;`;

export type QureauRoleKey = {
	pk: string;
	sk: QureauRoleEntity;
};
export class QureauRoleRow<Pk extends string = string>
	implements IRow<QureauRoleKey>
{
	pk: Pk;
	sk: QureauRoleEntity = "&Role!;";
    id: string;
    name: string;

	constructor(
		id: string,
		name: string,
	) {
		this.pk = id as Pk;
		this.sk = "&Role!;";
        this.id = id;
        this.name = name;
	}

	static getKey(partitionKey: string): QureauRoleKey {
		const [id] = partitionKey.split("-");
		return {
			pk: `role@${id}`,
			sk: "&Role!;",
		};
	}
}
