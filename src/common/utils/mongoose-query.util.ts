import {
  FilterQuery,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
} from 'mongoose';

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin';
export type FilterFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'objectId';

export interface FilterFieldConfig {
  path?: string;
  type?: FilterFieldType;
  operators?: FilterOperator[];
  parser?: (value: unknown) => unknown;
  allowCommaSeparatedArrays?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

type PopulateSpec = string | PopulateOptions;

export interface MongooseQueryConfig<TDocument> {
  searchableFields?: string[];
  filterableFields?: Record<string, FilterFieldConfig>;
  allowedSortFields?: string[];
  defaultSort?: string | string[] | Record<string, 1 | -1>;
  baseFilter?: FilterQuery<TDocument>;
  defaultPopulate?: PopulateSpec | PopulateSpec[];
  allowedPopulatePaths?: string[];
  select?: ProjectionType<TDocument>;
  queryOptions?: QueryOptions<TDocument>;
  defaultLimit?: number;
  maxLimit?: number;
  lean?: boolean;
}

export interface ExecuteQueryArgs<TDocument> {
  model: Model<TDocument>;
  rawQuery?: Record<string, unknown>;
  config?: MongooseQueryConfig<TDocument>;
  baseFilter?: FilterQuery<TDocument>;
}

export interface ExecuteQueryResult<TDocument> {
  data: TDocument[];
  meta: PaginationMeta;
}

interface PaginationState {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_OPERATOR: FilterOperator = 'eq';
const OPERATOR_MONGO_MAP: Record<FilterOperator, string> = {
  eq: '$eq',
  ne: '$ne',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte',
  in: '$in',
  nin: '$nin',
};

/**
 * Builds and executes a consistent list query on top of a Mongoose model.
 * Applies search, filtering, sorting, pagination, and population in a single place
 * so individual services/controllers stay lean.
 */
export async function executeMongooseQuery<TDocument>(
  args: ExecuteQueryArgs<TDocument>,
): Promise<ExecuteQueryResult<TDocument>> {
  const { model, rawQuery = {}, config = {}, baseFilter } = args;

  const {
    searchableFields = [],
    filterableFields = {},
    allowedSortFields,
    defaultSort,
    baseFilter: configBaseFilter,
    defaultPopulate,
    allowedPopulatePaths,
    select,
    queryOptions,
    defaultLimit = 25,
    maxLimit = 100,
    lean = false,
  } = config;

  const normalizedQuery: Record<string, unknown> = isPlainObject(rawQuery)
    ? { ...rawQuery }
    : {};

  const pagination = resolvePagination(
    pickFirst(normalizedQuery.page, normalizedQuery.currentPage),
    pickFirst(
      normalizedQuery.limit,
      normalizedQuery.pageSize,
      normalizedQuery.perPage,
      normalizedQuery.take,
    ),
    pickFirst(normalizedQuery.offset, normalizedQuery.skip),
    defaultLimit,
    maxLimit,
  );

  const sort = resolveSort(
    pickFirst(normalizedQuery.sort, normalizedQuery.orderBy),
    allowedSortFields,
    defaultSort,
  );

  const filterClauses: FilterQuery<TDocument>[] = [];

  if (configBaseFilter) {
    filterClauses.push(configBaseFilter);
  }

  if (baseFilter) {
    filterClauses.push(baseFilter);
  }

  const rawFilterSource = pickFirst(
    normalizedQuery.filter,
    normalizedQuery.filters,
  );
  const filters = resolveFilters<TDocument>(
    rawFilterSource,
    normalizedQuery,
    filterableFields,
  );
  if (filters) {
    filterClauses.push(filters);
  }

  const searchInput = pickFirst(normalizedQuery.search, normalizedQuery.q);
  const searchClause = resolveSearch<TDocument>(searchInput, searchableFields);
  if (searchClause) {
    filterClauses.push(searchClause);
  }

  const mongoFilter = combineFilters(filterClauses);

  const findQuery = model.find(mongoFilter, select, queryOptions);

  if (sort) {
    findQuery.sort(sort);
  }

  findQuery.skip(pagination.skip).limit(pagination.limit);

  const populateSpecs = resolvePopulate(
    pickFirst(normalizedQuery.populate, normalizedQuery.populates),
    defaultPopulate,
    allowedPopulatePaths,
  );

  if (populateSpecs.length) {
    findQuery.populate(
      populateSpecs.map((spec) =>
        typeof spec === 'string' ? { path: spec } : spec,
      ),
    );
  }

  if (lean) {
    findQuery.lean();
  }

  const [documents, totalItems] = await Promise.all([
    findQuery.exec(),
    model.countDocuments(mongoFilter).exec(),
  ]);

  const meta = buildPaginationMeta(
    pagination.page,
    pagination.limit,
    totalItems,
  );

  return {
    data: documents,
    meta,
  };
}

function resolvePagination(
  rawPage: unknown,
  rawLimit: unknown,
  rawOffset: unknown,
  defaultLimit: number,
  maxLimit: number,
): PaginationState {
  const page = Math.max(parsePositiveInt(rawPage) ?? 1, 1);
  const limit = clamp(parsePositiveInt(rawLimit) ?? defaultLimit, 1, maxLimit);
  const offset = Math.max(
    parseNonNegativeInt(rawOffset) ?? (page - 1) * limit,
    0,
  );
  const effectivePage = Math.floor(offset / limit) + 1;

  return {
    page: effectivePage,
    limit,
    skip: offset,
  };
}

function resolveSort(
  rawSort: unknown,
  allowedSortFields?: string[],
  defaultSort?: string | string[] | Record<string, 1 | -1>,
): Record<string, 1 | -1> | undefined {
  const sort = normalizeSort(rawSort, allowedSortFields);
  if (sort && Object.keys(sort).length > 0) {
    return sort;
  }

  if (!defaultSort) {
    return undefined;
  }

  return normalizeSort(defaultSort, allowedSortFields);
}

function resolveFilters<TDocument>(
  rawFilters: unknown,
  fullQuery: Record<string, unknown>,
  filterableFields: Record<string, FilterFieldConfig>,
): FilterQuery<TDocument> | null {
  if (!filterableFields || Object.keys(filterableFields).length === 0) {
    return null;
  }

  const filters: FilterQuery<TDocument> = {};
  const source = parseFilterSource(rawFilters);

  for (const [key, fieldConfig] of Object.entries(filterableFields)) {
    const path = fieldConfig.path ?? key;
    let value = source[key];

    if (value === undefined) {
      value = extractFilterValueFromQuery(fullQuery, key, fieldConfig);
    }

    if (value === undefined) {
      value = fullQuery[key];
    }

    if (value === undefined) {
      continue;
    }

    const resolved = buildFieldFilter(value, fieldConfig);
    if (resolved === undefined) {
      continue;
    }

    if (isPlainObject(resolved)) {
      const entries = Object.entries(resolved);
      if (entries.length === 1 && entries[0]?.[0] === '$eq') {
        Object.assign(filters, { [path]: entries[0][1] });
        continue;
      }
    }

    Object.assign(filters, { [path]: resolved });
  }

  return Object.keys(filters).length > 0 ? filters : null;
}

function extractFilterValueFromQuery(
  query: Record<string, unknown>,
  fieldKey: string,
  config: FilterFieldConfig,
): unknown {
  if (!query || Object.keys(query).length === 0) {
    return undefined;
  }

  const operators =
    config.operators && config.operators.length
      ? config.operators
      : [DEFAULT_OPERATOR];

  const allowedOperators = new Set<FilterOperator>(operators);
  const supportsEq = allowedOperators.has('eq');

  const collected: Record<string, unknown> = {};
  let matched = false;

  for (const [rawKey, rawValue] of Object.entries(query)) {
    const match = rawKey.match(/^(filters?)\[([^\]]+)\](?:\[(.+)\])?$/);
    if (!match) {
      continue;
    }

    const [, , field, remainder] = match;
    if (field !== fieldKey) {
      continue;
    }

    if (!remainder) {
      if (!supportsEq) {
        continue;
      }
      collected.eq = mergeFilterOperatorValue(collected.eq, rawValue);
      matched = true;
      continue;
    }

    const segments = remainder.split('][');
    const operatorKey = segments.shift();
    if (!operatorKey || !allowedOperators.has(operatorKey as FilterOperator)) {
      continue;
    }

    collected[operatorKey] = mergeFilterOperatorValue(
      collected[operatorKey],
      rawValue,
    );
    matched = true;
  }

  if (!matched) {
    return undefined;
  }

  const operatorKeys = Object.keys(collected);
  if (operatorKeys.length === 1 && operatorKeys[0] === 'eq') {
    const eqValue = collected.eq;
    if (Array.isArray(eqValue)) {
      return eqValue.length === 1 ? eqValue[0] : eqValue;
    }
    return eqValue;
  }

  return collected;
}

function mergeFilterOperatorValue(
  existing: unknown,
  incoming: unknown,
): unknown {
  if (incoming === undefined) {
    return existing;
  }

  if (existing === undefined) {
    return incoming;
  }

  const existingArray = Array.isArray(existing) ? existing : [existing];

  if (Array.isArray(incoming)) {
    return existingArray.concat(incoming);
  }

  existingArray.push(incoming);
  return existingArray;
}

function resolveSearch<TDocument>(
  rawSearch: unknown,
  searchableFields: string[],
): FilterQuery<TDocument> | null {
  if (!searchableFields || searchableFields.length === 0) {
    return null;
  }

  const searchTerm = toSearchString(rawSearch);
  if (!searchTerm) {
    return null;
  }

  const escaped = escapeRegExp(searchTerm);
  const regex = new RegExp(escaped, 'i');
  const conditions = searchableFields.map<FilterQuery<TDocument>>(
    (field) => ({ [field]: regex }) as FilterQuery<TDocument>,
  );

  if (!conditions.length) {
    return null;
  }

  return { $or: conditions } as FilterQuery<TDocument>;
}

function resolvePopulate(
  rawPopulate: unknown,
  defaultPopulate: PopulateSpec | PopulateSpec[] | undefined,
  allowedPaths?: string[],
): PopulateSpec[] {
  const populates: PopulateSpec[] = [];

  if (isUnknownArray(defaultPopulate)) {
    populates.push(...defaultPopulate);
  } else if (defaultPopulate) {
    populates.push(defaultPopulate);
  }

  const dynamicPopulate = normalizePopulate(rawPopulate, allowedPaths);
  if (dynamicPopulate.length) {
    populates.push(...dynamicPopulate);
  }

  return dedupePopulate(populates);
}

function combineFilters<TDocument>(
  clauses: FilterQuery<TDocument>[],
): FilterQuery<TDocument> {
  const sanitized = clauses.filter(
    (clause) => clause && Object.keys(clause).length > 0,
  );

  if (sanitized.length === 0) {
    return {};
  }

  if (sanitized.length === 1) {
    return sanitized[0];
  }

  return { $and: sanitized };
}

function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function buildFieldFilter(value: unknown, config: FilterFieldConfig): unknown {
  const operators = new Set(
    config.operators && config.operators.length
      ? config.operators
      : [DEFAULT_OPERATOR],
  );

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};

    for (const [operatorKey, rawOperatorValue] of Object.entries(value)) {
      const operator = normalizeOperator(operatorKey);
      if (!operator || !operators.has(operator)) {
        continue;
      }

      const converted = convertValueByType(rawOperatorValue, config, operator);
      if (converted === undefined) {
        continue;
      }

      result[OPERATOR_MONGO_MAP[operator]] = converted;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  if (!operators.has('eq')) {
    return undefined;
  }

  const converted = convertValueByType(value, config, 'eq');
  return converted === undefined ? undefined : converted;
}

function convertValueByType(
  value: unknown,
  config: FilterFieldConfig,
  operator: FilterOperator,
): unknown {
  if (config.parser) {
    const parsed = config.parser(value);
    if (parsed === null || parsed === undefined) {
      return undefined;
    }
    return parsed;
  }

  const type = config.type ?? 'string';

  if (operator === 'in' || operator === 'nin') {
    const allowComma = config.allowCommaSeparatedArrays !== false;
    const arrayValues = toArray(value, allowComma);
    const convertedArray = arrayValues
      .map((entry) => convertPrimitive(entry, type))
      .filter((entry) => entry !== undefined);

    return convertedArray.length ? convertedArray : undefined;
  }

  return convertPrimitive(value, type);
}

function convertPrimitive(value: unknown, type: FilterFieldType): unknown {
  switch (type) {
    case 'number': {
      const numberValue =
        typeof value === 'number'
          ? value
          : typeof value === 'string'
            ? Number(value)
            : NaN;
      return Number.isFinite(numberValue) ? numberValue : undefined;
    }
    case 'boolean': {
      return parseBoolean(value);
    }
    case 'date': {
      return parseDate(value);
    }
    case 'objectId': {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }
      if (typeof value === 'number') {
        return String(value);
      }
      return undefined;
    }
    case 'string':
    default: {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return undefined;
    }
  }
}

function normalizeOperator(rawOperator: string): FilterOperator | null {
  const sanitized = rawOperator.replace(/^\$/, '').toLowerCase();

  switch (sanitized) {
    case 'eq':
    case 'ne':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
    case 'in':
    case 'nin':
      return sanitized;
    default:
      return null;
  }
}

function normalizeSort(
  value: unknown,
  allowedSortFields?: string[],
): Record<string, 1 | -1> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const tokens: Array<{ field: string; direction: 1 | -1 }> = [];

  if (isPlainObject(value)) {
    for (const [field, dirValue] of Object.entries(value)) {
      const direction = parseSortDirection(dirValue);
      if (!direction) {
        continue;
      }
      tokens.push({ field, direction });
    }
  } else {
    const rawPieces: string[] = [];

    if (isUnknownArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string') {
          rawPieces.push(...entry.split(','));
        } else if (typeof entry === 'number') {
          rawPieces.push(String(entry));
        }
      }
    } else if (typeof value === 'string') {
      rawPieces.push(...value.split(','));
    } else if (typeof value === 'number') {
      rawPieces.push(String(value));
    }

    for (const piece of rawPieces) {
      const token = piece.trim();
      if (!token) {
        continue;
      }

      let direction: 1 | -1 = 1;
      let field = token;

      if (token.startsWith('-')) {
        direction = -1;
        field = token.slice(1);
      } else if (token.startsWith('+')) {
        field = token.slice(1);
      }

      const normalizedField = field.trim();
      if (!normalizedField) {
        continue;
      }

      tokens.push({ field: normalizedField, direction });
    }
  }

  if (tokens.length === 0) {
    return undefined;
  }

  const sort: Record<string, 1 | -1> = {};
  const allowList =
    allowedSortFields && allowedSortFields.length
      ? new Set(allowedSortFields)
      : null;

  for (const { field, direction } of tokens) {
    if (allowList && !allowList.has(field)) {
      continue;
    }
    sort[field] = direction;
  }

  return Object.keys(sort).length > 0 ? sort : undefined;
}

function parseSortDirection(value: unknown): 1 | -1 | null {
  if (typeof value === 'number') {
    if (value > 0) {
      return 1;
    }
    if (value < 0) {
      return -1;
    }
    return null;
  }

  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'asc' || lower === '1') {
      return 1;
    }
    if (lower === 'desc' || lower === '-1') {
      return -1;
    }
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : -1;
  }

  return null;
}

function normalizePopulate(value: unknown, allowedPaths?: string[]): string[] {
  if (!value || !allowedPaths || allowedPaths.length === 0) {
    return [];
  }

  const tokens = toArray(value, true)
    .map((token) => {
      if (typeof token === 'string') {
        return token.trim();
      }
      if (typeof token === 'number') {
        return String(token);
      }
      return '';
    })
    .filter((token) => token.length > 0);

  if (!tokens.length) {
    return [];
  }

  const allowedSet = new Set(allowedPaths);
  return tokens.filter((token) => allowedSet.has(token));
}

function dedupePopulate(populates: PopulateSpec[]): PopulateSpec[] {
  if (!populates.length) {
    return populates;
  }

  const seen = new Set<string>();
  const result: PopulateSpec[] = [];

  for (const spec of populates) {
    if (typeof spec === 'string') {
      if (seen.has(spec)) {
        continue;
      }
      seen.add(spec);
      result.push(spec);
      continue;
    }

    const key = spec.path;
    if (key && seen.has(key)) {
      continue;
    }

    if (key) {
      seen.add(key);
    }
    result.push(spec);
  }

  return result;
}

function parseFilterSource(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (isPlainObject(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function toArray(value: unknown, allowCommaSplit: boolean): unknown[] {
  if (isUnknownArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  if (typeof value === 'string') {
    if (!allowCommaSplit) {
      return [value];
    }
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [value];
}

function toSearchString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  if (isUnknownArray(value) && value.length) {
    const first = value[0];
    return typeof first === 'string' ? first.trim() : undefined;
  }

  return undefined;
}

function escapeRegExp(input: string): string {
  return input.replace(/[\^$.*+?()[\]{}|/-]/g, (segment) => '\\' + segment);
}

function parsePositiveInt(value: unknown): number | null {
  if (isUnknownArray(value)) {
    return parsePositiveInt(value[0]);
  }

  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue > 0 ? Math.floor(numberValue) : null;
}

function parseNonNegativeInt(value: unknown): number | null {
  if (isUnknownArray(value)) {
    return parseNonNegativeInt(value[0]);
  }

  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue >= 0 ? Math.floor(numberValue) : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(Math.min(value, max), min);
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 0) {
      return false;
    }
    if (value === 1) {
      return true;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return undefined;
}

function pickFirst(...values: unknown[]): unknown {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return Object.prototype.toString.call(input) === '[object Object]';
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
