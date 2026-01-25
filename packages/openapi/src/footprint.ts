/**
 * Code was stolen from https://gist.github.com/zaripych/963fa6584524e5b446b70548dbabbf65
 * and tweaked a bit to work with tuyau
 *
 * Purpose is to generates a "resolved" typescript type definition for a given type in a given file.
 *
 * Means if we pass an interface like `interface A { b: User }` to this function, it will generate a
 * resolved type like : `interface A { b: { id: string, name: string } }`
 */

import type { Type, Symbol, Signature, Node } from 'ts-morph'
import { Project, SymbolFlags, TypeFormatFlags } from 'ts-morph'

const projects = new Map<string, Project>()

const project = (tsConfigFilePath: string) => {
  const project = projects.get(tsConfigFilePath)
  const result = project ?? new Project({ tsConfigFilePath })
  projects.set(tsConfigFilePath, result)

  return result
}

/**
 * Built-in/utility types that should NOT be preserved as named references.
 * These are either TypeScript built-ins or framework utility types that
 * should be expanded inline rather than referenced.
 */
const BUILTIN_TYPES = new Set([
  // TypeScript built-ins
  'Array',
  'Promise',
  'Record',
  'Partial',
  'Pick',
  'Omit',
  'Required',
  'Readonly',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'Parameters',
  'InstanceType',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Date',
  'RegExp',
  // Tuyau utility types
  'MakeTuyauRequest',
  'MakeTuyauResponse',
  'MakeNonSerializedTuyauResponse',
  'Serialize',
  'SerializeObject',
  'SerializeTuple',
  'Simplify',
  'Prettify',
  'MakeOptional',
  'ConvertReturnTypeToRecordStatusResponse',
  // VineJS types
  'InferInput',
  'InferOutput',
  // Kysely types
  'Generated',
  'ColumnType',
  'Insertable',
  'Selectable',
  'Updateable',
])

/**
 * Information about a collected type alias
 */
export interface CollectedAlias {
  name: string
  expandedType: string
}

export function typeFootprint(
  fileName: string,
  typeName: string,
  opts: { overrides?: Record<string, string>; tsConfigFilePath: string },
): string {
  const p = project(opts.tsConfigFilePath)
  const s = p.addSourceFileAtPath(fileName)
  const a = s.getInterfaceOrThrow(typeName)
  const t = a.getType()

  // Collect type aliases during traversal
  const collectedAliases = new Map<string, CollectedAlias>()

  const text = footprintOfType({
    type: t,
    node: a,
    overrides: opts?.overrides,
    collectedAliases,
  })

  // Generate type definitions for collected aliases
  const aliasDefinitions = Array.from(collectedAliases.values())
    .map(({ name, expandedType }) => `type ${name} = ${expandedType};`)
    .join('\n')

  const prefix = aliasDefinitions ? aliasDefinitions + '\n\n' : ''

  return prefix + `interface ${typeName} ` + text
}

/**
 * Returns the collected aliases from the last typeFootprint call.
 * Useful for the generator to know which types to add to components/schemas.
 */
export function getCollectedAliases(
  fileName: string,
  typeName: string,
  opts: { overrides?: Record<string, string>; tsConfigFilePath: string },
): CollectedAlias[] {
  const p = project(opts.tsConfigFilePath)
  const s = p.addSourceFileAtPath(fileName)
  const a = s.getInterfaceOrThrow(typeName)
  const t = a.getType()

  const collectedAliases = new Map<string, CollectedAlias>()

  footprintOfType({
    type: t,
    node: a,
    overrides: opts?.overrides,
    collectedAliases,
  })

  return Array.from(collectedAliases.values())
}

function isPrimitive(type: Type) {
  if (type.isString()) return true
  if (type.isStringLiteral()) return true
  if (type.isUndefined()) return true
  if (type.isNull()) return true
  if (type.isUnknown()) return true
  if (type.isAny()) return true
  if (type.isNumber()) return true
  if (type.isNumberLiteral()) return true
  if (type.isBoolean()) return true
  if (type.isBooleanLiteral()) return true
  if (intrinsicNameOf(type) === 'void') return true

  return false
}

function isPromise(type: Type) {
  const symbol = type.getSymbol()
  if (!type.isObject() || !symbol) return false

  const args = type.getTypeArguments()
  return symbol.getName() === 'Promise' && args.length === 1
}

function isSimpleSignature(type: Type) {
  if (!type.isObject()) return false

  const sigs = type.getCallSignatures()
  const props = type.getProperties()
  const args = type.getTypeArguments()
  const indexType = type.getNumberIndexType()
  const stringType = type.getStringIndexType()
  return sigs.length === 1 && props.length === 0 && args.length === 0 && !indexType && !stringType
}

function intrinsicNameOf(type: Type) {
  return (type.compilerType as unknown as { intrinsicName: string }).intrinsicName
}

type FormatFlags =
  | false // <- to be able to pass down conditional flags
  | 'remove-undefined-from-intersections'

/**
 * Check if a type is an endpoint wrapper type (has request/response properties)
 */
function isEndpointWrapperType(type: Type): boolean {
  if (!type.isObject()) return false
  const propNames = type.getProperties().map(p => p.getName())
  return propNames.includes('request') && propNames.includes('response')
}

/**
 * Check if a type alias should be preserved as a named reference
 */
function shouldPreserveAlias(aliasName: string, type: Type): boolean {
  // Don't preserve built-in types
  if (BUILTIN_TYPES.has(aliasName)) {
    return false
  }

  // Preserve endpoint wrapper types - they'll be processed specially to extract response schemas
  if (isEndpointWrapperType(type)) {
    return true
  }

  // Only preserve union types of string literals (enums)
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes()
    // Preserve if it's a union of string literals (like enum-style types)
    if (unionTypes.every((t) => t.isStringLiteral() || t.isNumberLiteral() || t.isNull() || t.isUndefined())) {
      return true
    }
  }

  return false
}

function footprintOfType(params: {
  type: Type
  node: Node
  overrides?: Record<string, string>
  collectedAliases?: Map<string, CollectedAlias>
  flags?: FormatFlags[]
  callStackLevel?: number
  /** When true, we're expanding an alias - don't check for alias again */
  expandingAlias?: boolean
}): string {
  const { type, node, overrides, collectedAliases, flags = [], callStackLevel = 0, expandingAlias = false } = params

  if (callStackLevel > 20) {
    // too deep?
    return "'...'"
  }

  const next = (nextType: Type, nextFlags: FormatFlags[] = [], forceExpand = false) => {
    return footprintOfType({
      node,
      overrides,
      collectedAliases,
      type: nextType,
      flags: nextFlags,
      callStackLevel: callStackLevel + 1,
      expandingAlias: forceExpand,
    })
  }

  const indent = (text: string, lvl: number = 1) => text.replace(/^/gm, ' '.repeat(lvl * 2))

  const defaultFormat = () => {
    return type.getText(node, TypeFormatFlags.UseSingleQuotesForStringLiteralType)
  }

  // Check for type alias - but only if we're not already expanding one
  const aliasSymbol = type.getAliasSymbol()
  if (aliasSymbol && !expandingAlias) {
    const aliasName = aliasSymbol.getName()

    // Check overrides first
    if (overrides) {
      const result = overrides[aliasName]
      if (result) {
        return result
      }
    }

    // Check if this alias should be preserved
    if (collectedAliases && shouldPreserveAlias(aliasName, type)) {
      // If we haven't collected this alias yet, expand it now
      if (!collectedAliases.has(aliasName)) {
        // Generate the expanded type (force expansion to avoid infinite recursion)
        const expandedType = next(type, [], true)
        collectedAliases.set(aliasName, { name: aliasName, expandedType })
      }
      // Return just the alias name as a reference
      return aliasName
    }
  }

  if (isPrimitive(type)) {
    return defaultFormat()
  }

  if (type.getText() === 'Blob') {
    return defaultFormat()
  }

  if (type.isArray()) {
    const subType = type.getArrayElementTypeOrThrow()
    if (isPrimitive(subType)) return `${next(subType)}[]`

    return `Array<\n${indent(next(subType))}\n>`
  }

  if (type.isTuple()) {
    const types = type.getTupleElements()
    return ['[\n', indent(types.map((type) => next(type)).join(',\n')), '\n]'].join('')
  }

  if (type.isObject() && isPromise(type)) {
    const first = type.getTypeArguments()[0]
    if (!first) throw new Error('This should not have happened')
    if (isPrimitive(first)) return `Promise<${next(first)}>`

    return `Promise<\n${indent(next(first))}\n>`
  }

  /**
   * TODO: I didn't find a way to get the type of the enum values
   * enum.getMembers() returns an array of symbols. Not sure why.
   * So let's just return a string | number for now
   */
  if (type.isEnum()) {
    return `string | number`
  }

  if (type.isObject() && isSimpleSignature(type)) {
    return signatures(type.getCallSignatures(), 'type', next)
  }

  if (type.isObject()) {
    const props = type.getProperties()
    const sigs = type.getCallSignatures()
    const numIndex = type.getNumberIndexType()
    const stringIndex = type.getStringIndexType()
    if (props.length === 0 && sigs.length === 0 && !numIndex && !stringIndex) {
      return '{}'
    }
    const sigsText = signatures(sigs, 'declaration', next)
    const propsText = properties(props, node, next, collectedAliases)
    const numIndexText = numIndex && `[index: number]: ${next(numIndex)};`
    const stringIndexText = stringIndex && `[index: string]: ${next(stringIndex)};`
    return [
      '{\n',
      numIndexText && indent(numIndexText),
      stringIndexText && indent(stringIndexText),
      sigs.length > 0 && indent(sigsText),
      props.length > 0 && indent(propsText),
      '\n}',
    ]
      .filter(Boolean)
      .join('')
  }

  if (type.isUnion()) {
    return type
      .getUnionTypes()
      .filter((type) => {
        if (flags.includes('remove-undefined-from-intersections')) {
          return !type.isUndefined()
        }
        return true
      })
      .map((type) => next(type))
      .join(' | ')
  }

  if (type.isIntersection()) {
    return type
      .getIntersectionTypes()
      .map((type) => next(type))
      .join(' & ')
  }

  // when you encounter this, consider opening an issue to add support for it
  return 'TODO'
}

function properties(
  props: Symbol[],
  node: Node,
  next: (type: Type, flags: FormatFlags[]) => string,
  collectedAliases?: Map<string, CollectedAlias>,
) {
  return props.map((value) => property(value, node, next, collectedAliases)).join('\n')
}

function property(
  prop: Symbol,
  node: Node,
  next: (type: Type, flags: FormatFlags[]) => string,
  collectedAliases?: Map<string, CollectedAlias>,
): string {
  const type = prop.getTypeAtLocation(node)
  const sigs = type.getCallSignatures()
  const firstSig = sigs?.[0]
  if (isSimpleSignature(type) && !prop.hasFlags(SymbolFlags.Optional) && firstSig) {
    return signature(firstSig, 'declaration', next, prop.getName()) + ';'
  }

  const isOptional = prop.hasFlags(SymbolFlags.Optional)

  // Check if the property type is an alias that should be preserved
  const aliasSymbol = type.getAliasSymbol()
  if (aliasSymbol && collectedAliases) {
    const aliasName = aliasSymbol.getName()
    if (shouldPreserveAlias(aliasName, type)) {
      if (!collectedAliases.has(aliasName)) {
        // Generate expanded type
        const expandedType = footprintOfType({
          type,
          node,
          collectedAliases,
          expandingAlias: true,
        })
        collectedAliases.set(aliasName, { name: aliasName, expandedType })
      }
      // Return reference to alias
      return [
        `'${prop.getName()}'`,
        isOptional ? '?' : '',
        ': ',
        aliasName,
        ';',
      ].join('')
    }
  }

  // Check if this is a nullable alias (e.g., PlatformName | null) by comparing expanded types
  if (type.isUnion() && collectedAliases) {
    const unionTypes = type.getUnionTypes()
    const nonNullableTypes = unionTypes.filter((t) => !t.isNull() && !t.isUndefined())
    const isNullable = unionTypes.some((t) => t.isNull())
    const isUndefinable = unionTypes.some((t) => t.isUndefined())

    // Get the expanded form of the non-nullable part (e.g., "'core' | 'prodigy'" for PlatformName)
    // Normalize by extracting just the literal values
    const normalize = (s: string) => s.replace(/['"]/g, '').trim()
    const nonNullableLiterals = nonNullableTypes
      .filter((t) => t.isStringLiteral())
      .map((t) => normalize(t.getText(node)))
      .sort()

    // Only proceed if all non-nullable types are string literals
    if (nonNullableLiterals.length === nonNullableTypes.length && nonNullableLiterals.length > 0) {
      // Check if this matches any known alias's expanded type
      for (const [aliasName, alias] of collectedAliases) {
        // Extract literals from the alias's expanded type
        const aliasLiterals = alias.expandedType
          .split('|')
          .map((s) => normalize(s))
          .filter((s) => s.length > 0)
          .sort()

        if (
          nonNullableLiterals.length === aliasLiterals.length &&
          nonNullableLiterals.every((v, i) => v === aliasLiterals[i])
        ) {
          // Found a match! Use the alias reference
          const parts = [aliasName]
          if (isNullable) parts.push('null')
          if (isUndefinable) parts.push('undefined')
          return [
            `'${prop.getName()}'`,
            isOptional ? '?' : '',
            ': ',
            parts.join(' | '),
            ';',
          ].join('')
        }
      }
    }
  }

  return [
    `'${prop.getName()}'`,
    isOptional ? '?' : '',
    ': ',
    next(type, [isOptional && 'remove-undefined-from-intersections']),
    ';',
  ].join('')
}

function signatures(
  sigs: Signature[],
  variant: 'type' | 'declaration',
  next: (type: Type, flags: FormatFlags[]) => string,
) {
  return sigs.map((sig) => signature(sig, variant, next)).join('\n')
}

function signature(
  sig: Signature,
  variant: 'type' | 'declaration',
  next: (type: Type, flags: FormatFlags[]) => string,
  methodName?: string,
): string {
  const name = sig.getDeclaration().getSymbol()?.getName()
  const nameToUse = methodName ?? (['__type', '__call'].includes(name ?? '') ? '' : name)
  const params = sig.getParameters()

  return [
    variant === 'declaration' ? nameToUse : '',
    '(',
    params
      .map((param) => {
        return [
          param.getName(),
          param.hasFlags(SymbolFlags.Optional) ? '?' : '',
          ': ',
          param
            .getDeclarations()
            .map((decl) => next(decl.getType(), []))
            .join(','),
        ].join('')
      })
      .join(', '),
    ')',
    variant === 'declaration' ? ': ' : ' => ',
    next(sig.getReturnType(), []),
  ].join('')
}
