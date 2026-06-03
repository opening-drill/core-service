/**
 * Enum case mapping for the live-data contract.
 *
 * The database stores enums in SCREAMING_SNAKE (`STANDING`, `BUSY`,
 * `GAZA_SOUTH`, `VIEW`), while the contract exchanges the lowercase form
 * (`standing`, `busy`, `gaza_south`, `view`). The conversion is a pure
 * lower/upper-case transform, so these helpers cover every enum.
 */
import { z } from 'zod';

/** DB enum value → contract (lowercase) form, for outbound serialization. */
export function toContractEnum(value: string): string {
  return value.toLowerCase();
}

/**
 * Builds a Zod schema that accepts the contract's lowercase enum form and
 * transforms it to the database enum value. Unknown values fail validation
 * (→ 400 VALIDATION_ERROR). Derives the accepted set from the Prisma enum
 * object so it never drifts from the schema.
 */
export function contractEnumSchema<E extends Record<string, string>>(enumObj: E) {
  const lowerToUpper = new Map(
    Object.values(enumObj).map((v) => [v.toLowerCase(), v as E[keyof E]]),
  );
  const lowerValues = [...lowerToUpper.keys()] as [string, ...string[]];
  return z.enum(lowerValues).transform((v) => lowerToUpper.get(v) as E[keyof E]);
}
