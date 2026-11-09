// Workaround for a docs-only bug (API responses are NOT affected).
//
// nestjs-zod describes a nullable number/string as type: ["number", "null"].
// @nestjs/swagger reads an array in `type` as "this is an array", so the docs
// showed `daysPerWeek: [1]` instead of `daysPerWeek: 1`.
//
// Two passes:
// 1. TOP-LEVEL properties wrongly turned into arrays: nestjs-zod marks exactly
//    those with 'x-nestjs_zod-empty-type', so we turn them back into
//    `type: "number", nullable: true`. Real arrays (preferredActivities, ...)
//    have a string type and are untouched.
// 2. NESTED properties (inside objects, e.g. stats.totals.distanceMeters) are
//    not mangled, but keep the OpenAPI 3.1 notation ["number", "null"], which
//    is wrong in a 3.0 document. We rewrite them to `nullable: true` too.
//
// Call it on the document BEFORE cleanupOpenApiDoc(). Written for the default
// OpenAPI 3.0 document (uses `nullable: true`).
export function fixNullableTypes(doc: unknown): void {
  const schemas =
    (doc as { components?: { schemas?: Record<string, unknown> } }).components
      ?.schemas ?? {};

  // Pass 1
  for (const schema of Object.values(schemas)) {
    const properties =
      (schema as { properties?: Record<string, Record<string, any>> })
        .properties ?? {};

    for (const prop of Object.values(properties)) {
      if (
        prop['x-nestjs_zod-empty-type'] === true &&
        prop.type === 'array' &&
        typeof prop.items?.type === 'string'
      ) {
        prop.type = prop.items.type;
        prop.nullable = true;
        delete prop.items;
      }
    }
  }

  // Pass 2
  normalizeNullableTypeArrays(schemas);
}

function normalizeNullableTypeArrays(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(normalizeNullableTypeArrays);
    return;
  }
  if (node === null || typeof node !== 'object') return;

  const obj = node as Record<string, unknown>;
  const type = obj.type;
  if (Array.isArray(type) && type.includes('null')) {
    const rest = type.filter((t) => t !== 'null');
    if (rest.length === 1) {
      obj.type = rest[0];
      obj.nullable = true;
    }
  }
  Object.values(obj).forEach(normalizeNullableTypeArrays);
}