
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("roles", (table) => {
		table.string("id").primary();
		table.string("name").notNullable().unique();
	});

	await knex.schema.createTable("permissions", (table) => {
		table.string("id").primary();
		table.string("name").notNullable().unique();
		table.string("resource").notNullable();
	});

	await knex.schema.createTable("role_permissions", (table) => {
		table.string("role_id").references("id").inTable("roles").onDelete("CASCADE");
		table.string("permission_id").references("id").inTable("permissions").onDelete("CASCADE");
		table.primary(["role_id", "permission_id"]);
	});

	await knex.schema.createTable("user_roles", (table) => {
		table.string("user_pk");
		table.string("user_sk");
		table.string("role_id").references("id").inTable("roles").onDelete("CASCADE");
		table.foreign(["user_pk", "user_sk"]).references(["pk", "sk"]).inTable("qureau_users").onDelete("CASCADE");
		table.primary(["user_pk", "user_sk", "role_id"]);
	});

	// Seed default data
	const permissions = [
		{ id: "1", name: "create", resource: "users" },
		{ id: "2", name: "list", resource: "users" },
		{ id: "3", name: "set-role", resource: "users" },
		{ id: "4", name: "ban", resource: "users" },
		{ id: "5", name: "impersonate", resource: "users" },
		{ id: "6", name: "impersonate-admins", resource: "users" },
		{ id: "7", name: "delete", resource: "users" },
		{ id: "8", name: "set-password", resource: "users" },
	];

	await knex("permissions").insert(permissions);

	const adminRole = { id: "1", name: "admin" };
	await knex("roles").insert(adminRole);

	const rolePermissions = permissions.map(permission => ({
		role_id: adminRole.id,
		permission_id: permission.id
	}));

	await knex("role_permissions").insert(rolePermissions);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("user_roles");
	await knex.schema.dropTableIfExists("role_permissions");
	await knex.schema.dropTableIfExists("permissions");
	await knex.schema.dropTableIfExists("roles");
}
