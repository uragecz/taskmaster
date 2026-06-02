import { Migration } from '@mikro-orm/migrations';

export class Migration20260602120944 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "todo" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "text" varchar(255) not null, "done" boolean not null default false, "priority" text check ("priority" in ('low', 'medium', 'high')) not null default 'medium', "category" text check ("category" in ('personal', 'work', 'shopping', 'health', 'other')) not null default 'other', "due_date" date null, "completed_at" timestamptz null);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "todo" cascade;`);
  }

}
