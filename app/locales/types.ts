import type nl from './nl'

type Widen<T> = T extends string ? string : T extends readonly string[] ? string[] : { [K in keyof T]: Widen<T[K]> }

/** Every language file must have exactly the shape of the Dutch source. */
export type Messages = Widen<typeof nl>

export type MessageKey = Paths<Messages>

type Paths<T> = T extends string | string[]
  ? never
  : { [K in keyof T & string]: T[K] extends string | string[] ? K : `${K}.${Paths<T[K]>}` }[keyof T & string]
