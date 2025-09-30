export interface AccessScope {
  readonly organizationIds: ReadonlySet<string>;
  readonly orgWideOrganizationIds: ReadonlySet<string>;
  readonly projectIds: ReadonlySet<string>;
  readonly categoryIds: ReadonlySet<string>;
  readonly subcategoryIds: ReadonlySet<string>;
}

export type ScopeAction = 'read' | 'write';
