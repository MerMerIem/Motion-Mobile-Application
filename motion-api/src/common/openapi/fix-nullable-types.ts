// Workaround for a docs-only bug (API responses are NOT affected).
//
// nestjs-zod describes a nullable number/string as type: ["number", "null"].
// @nestjs/swagger reads an array in `type` as "this is an array", so the docs
// showed `daysPerWeek: [1]` instead of `daysPerWeek: 1`.
//
// nestjs-zod marks exactly those properties with 'x-nestjs_zod-empty-type',
// so we can find them and turn them back into `type: "number", nullable: true`.
// Real arrays (preferredActivities, ...) have a string type and are untouched.
//
// Call it on the document BEFORE cleanupOpenApiDoc(). Written for the default
// OpenAPI 3.0 document (uses `nullable: true`).
export function fixNullableTypes(doc: unknown): void {
  const schemas =
    (doc as { components?: { schemas?: Record<string, unknown> } }).components
      ?.schemas ?? {};

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
}