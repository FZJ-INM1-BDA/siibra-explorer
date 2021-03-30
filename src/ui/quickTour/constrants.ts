export interface QuickTourData {
    order: number
    description: string
    position?: QuickTourPosition
}

export interface QuickTourPosition {
    // Position of tip
    position?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
    align?: 'right' | 'left' | 'top' | 'bottom' | 'center'
    left?: number
    top?: number

    // Position of arrow
    arrow?: string
    arrowPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
    arrowAlign?: 'right' | 'left' | 'top' | 'bottom' | 'center'
    arrowMargin?: {top?: number, right?: number, bottom?: number, left?: number}
    arrowTransform?: string
}
