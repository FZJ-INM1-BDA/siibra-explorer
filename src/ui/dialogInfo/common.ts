export type FallBackData = {
  title: string
  titleMd?: string
  actions?: string[]
  desc?: string
  descMd?: string
  actionsAsList?: boolean
  isActiveAction?: (action: string) => boolean
}
