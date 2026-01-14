export type TUrlStandaloneVolume<T> = {
  sv: T // standalone volume
}

export type TUrlAtlas<T> = {
  a: T   // atlas
  t: T   // template
  p: T   // parcellation
  r?: T  // region selected (deprecated)
  rn?: T // region selected (hashed)
  g?: T // geometry selected (point, face (NYI))
}

export type TUrlPlugin<T> = {
  pl: T  // pluginState
}

export type TUrlNav<T> = {
  ['@']: T // navstring
  vs?: T
}

export type TUrlViewFeat<T> = {
  f: T
}

export type TConditional<T> = Partial<
  TUrlPlugin<T> &
  TUrlNav<T> & 
  TUrlViewFeat<T>
>

export type TUrlPathObj<T, V> = 
  (V extends TUrlStandaloneVolume<T>
      ? TUrlStandaloneVolume<T>
      : TUrlAtlas<T>)
  & TConditional<T>
