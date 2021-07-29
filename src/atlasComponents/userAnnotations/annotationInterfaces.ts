
export interface ViewerAnnotation {
    id: string
    position1: number[]
    position2: number[]
    name: string
    description: string
    type: string
    circular: boolean
    atlas: {name: string, id: string}
    template: {name: string, id: string}
    annotationVisible: boolean
}

export interface GroupedAnnotation {
    id: string
    position1?: number[]
    position2?: number[]
    annotations?: PolygonAnnotations[]
    positions?: PolygonPositions[]
    dimension?: string

    name: string
    description: string
    type: string
    circular?: boolean
    atlas: {name: string, id: string}
    template: {name: string, id: string}
    annotationVisible: boolean
}

export interface PolygonAnnotations {
    id: string
    position1: number[]
    position2: number[]
}

export interface PolygonPositions {
    position: number[]
    lines: {id: string, point: number}[]
}

export interface AnnotationType {
    name: string
    class: string
    type: string
    action: string
}
