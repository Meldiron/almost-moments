import { type Models } from 'appwrite';

export type GalleriesCreate = {
    "name": string;
    "description"?: string | null;
    "expiryAt"?: string | null;
    "assets"?: ((GalleryAssetsCreate & { $id?: string; $permissions?: string[] }) | string)[];
}

export type Galleries = Models.Row & {
    "name": string;
    "description"?: string | null;
    "expiryAt"?: string | null;
    "assets"?: GalleryAssets[];
}

export type GalleryAssetsCreate = {
    "gallery"?: ((GalleriesCreate & { $id?: string; $permissions?: string[] }) | string);
    "fileId": string;
}

export type GalleryAssets = Models.Row & {
    "gallery"?: Galleries;
    "fileId": string;
}

declare const __roleStringBrand: unique symbol;
export type RoleString = string & { readonly [__roleStringBrand]: never };

export type RoleBuilder = {
  any: () => RoleString;
  user: (userId: string, status?: string) => RoleString;
  users: (status?: string) => RoleString;
  guests: () => RoleString;
  team: (teamId: string, role?: string) => RoleString;
  member: (memberId: string) => RoleString;
  label: (label: string) => RoleString;
}

export type PermissionBuilder = {
  read: (role: RoleString) => string;
  write: (role: RoleString) => string;
  create: (role: RoleString) => string;
  update: (role: RoleString) => string;
  delete: (role: RoleString) => string;
}

export type PermissionCallback = (permission: PermissionBuilder, role: RoleBuilder) => string[];

export type QueryValue = string | number | boolean;

export type ExtractQueryValue<T> = T extends (infer U)[]
  ? U extends QueryValue ? U : never
  : T extends QueryValue | null ? NonNullable<T> : never;

export type QueryableKeys<T> = {
  [K in keyof T]: ExtractQueryValue<T[K]> extends never ? never : K;
}[keyof T];

export type QueryBuilder<T> = {
  equal: <K extends QueryableKeys<T>>(field: K, value: ExtractQueryValue<T[K]>) => string;
  notEqual: <K extends QueryableKeys<T>>(field: K, value: ExtractQueryValue<T[K]>) => string;
  lessThan: <K extends QueryableKeys<T>>(field: K, value: ExtractQueryValue<T[K]>) => string;
  lessThanEqual: <K extends QueryableKeys<T>>(field: K, value: ExtractQueryValue<T[K]>) => string;
  greaterThan: <K extends QueryableKeys<T>>(field: K, value: ExtractQueryValue<T[K]>) => string;
  greaterThanEqual: <K extends QueryableKeys<T>>(field: K, value: ExtractQueryValue<T[K]>) => string;
  contains: <K extends QueryableKeys<T>>(field: K, value: ExtractQueryValue<T[K]>) => string;
  search: <K extends QueryableKeys<T>>(field: K, value: string) => string;
  isNull: <K extends QueryableKeys<T>>(field: K) => string;
  isNotNull: <K extends QueryableKeys<T>>(field: K) => string;
  startsWith: <K extends QueryableKeys<T>>(field: K, value: string) => string;
  endsWith: <K extends QueryableKeys<T>>(field: K, value: string) => string;
  between: <K extends QueryableKeys<T>>(field: K, start: ExtractQueryValue<T[K]>, end: ExtractQueryValue<T[K]>) => string;
  select: <K extends keyof T>(fields: K[]) => string;
  orderAsc: <K extends keyof T>(field: K) => string;
  orderDesc: <K extends keyof T>(field: K) => string;
  limit: (value: number) => string;
  offset: (value: number) => string;
  cursorAfter: (documentId: string) => string;
  cursorBefore: (documentId: string) => string;
  or: (...queries: string[]) => string;
  and: (...queries: string[]) => string;
}

export type DatabaseId = "main";

export type DatabaseTableMap = {
  "main": {
    "galleries": {
      create: (data: {
        "name": string;
        "description"?: string | null;
        "expiryAt"?: string | null;
        "assets"?: ((GalleryAssetsCreate & { $id?: string; $permissions?: string[] }) | string)[];
      }, options?: { rowId?: string; permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Galleries>;
      get: (id: string) => Promise<Galleries>;
      update: (id: string, data: Partial<{
        "name": string;
        "description"?: string | null;
        "expiryAt"?: string | null;
        "assets"?: ((GalleryAssetsCreate & { $id?: string; $permissions?: string[] }) | string)[];
      }>, options?: { permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Galleries>;
      delete: (id: string, options?: { transactionId?: string }) => Promise<void>;
      list: (options?: { queries?: (q: { equal: <K extends QueryableKeys<Galleries>>(field: K, value: ExtractQueryValue<Galleries[K]>) => string; notEqual: <K extends QueryableKeys<Galleries>>(field: K, value: ExtractQueryValue<Galleries[K]>) => string; lessThan: <K extends QueryableKeys<Galleries>>(field: K, value: ExtractQueryValue<Galleries[K]>) => string; lessThanEqual: <K extends QueryableKeys<Galleries>>(field: K, value: ExtractQueryValue<Galleries[K]>) => string; greaterThan: <K extends QueryableKeys<Galleries>>(field: K, value: ExtractQueryValue<Galleries[K]>) => string; greaterThanEqual: <K extends QueryableKeys<Galleries>>(field: K, value: ExtractQueryValue<Galleries[K]>) => string; contains: <K extends QueryableKeys<Galleries>>(field: K, value: ExtractQueryValue<Galleries[K]>) => string; search: <K extends QueryableKeys<Galleries>>(field: K, value: string) => string; isNull: <K extends QueryableKeys<Galleries>>(field: K) => string; isNotNull: <K extends QueryableKeys<Galleries>>(field: K) => string; startsWith: <K extends QueryableKeys<Galleries>>(field: K, value: string) => string; endsWith: <K extends QueryableKeys<Galleries>>(field: K, value: string) => string; between: <K extends QueryableKeys<Galleries>>(field: K, start: ExtractQueryValue<Galleries[K]>, end: ExtractQueryValue<Galleries[K]>) => string; select: <K extends keyof Galleries>(fields: K[]) => string; orderAsc: <K extends keyof Galleries>(field: K) => string; orderDesc: <K extends keyof Galleries>(field: K) => string; limit: (value: number) => string; offset: (value: number) => string; cursorAfter: (documentId: string) => string; cursorBefore: (documentId: string) => string; or: (...queries: string[]) => string; and: (...queries: string[]) => string }) => string[] }) => Promise<{ total: number; rows: Galleries[] }>;
    };
    "galleryAssets": {
      create: (data: {
        "gallery"?: ((GalleriesCreate & { $id?: string; $permissions?: string[] }) | string);
        "fileId": string;
      }, options?: { rowId?: string; permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<GalleryAssets>;
      get: (id: string) => Promise<GalleryAssets>;
      update: (id: string, data: Partial<{
        "gallery"?: ((GalleriesCreate & { $id?: string; $permissions?: string[] }) | string);
        "fileId": string;
      }>, options?: { permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<GalleryAssets>;
      delete: (id: string, options?: { transactionId?: string }) => Promise<void>;
      list: (options?: { queries?: (q: { equal: <K extends QueryableKeys<GalleryAssets>>(field: K, value: ExtractQueryValue<GalleryAssets[K]>) => string; notEqual: <K extends QueryableKeys<GalleryAssets>>(field: K, value: ExtractQueryValue<GalleryAssets[K]>) => string; lessThan: <K extends QueryableKeys<GalleryAssets>>(field: K, value: ExtractQueryValue<GalleryAssets[K]>) => string; lessThanEqual: <K extends QueryableKeys<GalleryAssets>>(field: K, value: ExtractQueryValue<GalleryAssets[K]>) => string; greaterThan: <K extends QueryableKeys<GalleryAssets>>(field: K, value: ExtractQueryValue<GalleryAssets[K]>) => string; greaterThanEqual: <K extends QueryableKeys<GalleryAssets>>(field: K, value: ExtractQueryValue<GalleryAssets[K]>) => string; contains: <K extends QueryableKeys<GalleryAssets>>(field: K, value: ExtractQueryValue<GalleryAssets[K]>) => string; search: <K extends QueryableKeys<GalleryAssets>>(field: K, value: string) => string; isNull: <K extends QueryableKeys<GalleryAssets>>(field: K) => string; isNotNull: <K extends QueryableKeys<GalleryAssets>>(field: K) => string; startsWith: <K extends QueryableKeys<GalleryAssets>>(field: K, value: string) => string; endsWith: <K extends QueryableKeys<GalleryAssets>>(field: K, value: string) => string; between: <K extends QueryableKeys<GalleryAssets>>(field: K, start: ExtractQueryValue<GalleryAssets[K]>, end: ExtractQueryValue<GalleryAssets[K]>) => string; select: <K extends keyof GalleryAssets>(fields: K[]) => string; orderAsc: <K extends keyof GalleryAssets>(field: K) => string; orderDesc: <K extends keyof GalleryAssets>(field: K) => string; limit: (value: number) => string; offset: (value: number) => string; cursorAfter: (documentId: string) => string; cursorBefore: (documentId: string) => string; or: (...queries: string[]) => string; and: (...queries: string[]) => string }) => string[] }) => Promise<{ total: number; rows: GalleryAssets[] }>;
    }
  }
};

export type DatabaseHandle<D extends DatabaseId> = {
  use: <T extends keyof DatabaseTableMap[D] & string>(tableId: T) => DatabaseTableMap[D][T];

};

export type DatabaseTables = {
  use: <D extends DatabaseId>(databaseId: D) => DatabaseHandle<D>;

};
