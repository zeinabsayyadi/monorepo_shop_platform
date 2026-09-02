import { MongoAbility } from '@casl/ability';

export type Subjects =
  | 'Product'
  | 'Category'
  | 'Order'
  | 'User'
  | 'Finance'
  | 'Coupon'
  | 'Analytics'
  | 'Content'
  | 'SEO'
  | 'Settings'
  | 'Role'
  | 'AuditLog'
  | 'all';

export type Actions =
  'manage' | 'create' | 'read' | 'update' | 'delete' | 'export' | 'refund';

export type AppAbility = MongoAbility<[Actions, Subjects]>;
