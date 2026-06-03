import { Migration } from '@mikro-orm/migrations';

export class Migration20260603074619 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "password_hash" varchar(255) not null);`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`alter table "todo" add column "user_id" int not null;`);
    this.addSql(`alter table "todo" add constraint "todo_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`create index "todo_user_id_created_at_index" on "todo" ("user_id", "created_at");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "todo" drop constraint "todo_user_id_foreign";`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop index "todo_user_id_created_at_index";`);
    this.addSql(`alter table "todo" drop column "user_id";`);
  }

}
