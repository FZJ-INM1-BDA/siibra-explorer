
const PROD_GEOMSVC_HOST = "https://geom-svc.apps.ebrains.eu"
const DEV_GEOMSVC_HOST = "https://geometry-service.apps.dev-adacloud.ebrains.eu"
const LOCAL_GEOMSVC_HOST = "http://localhost:8000"

export const GEOMSVC_HOST = LOCAL_GEOMSVC_HOST || DEV_GEOMSVC_HOST || PROD_GEOMSVC_HOST

export type PaginatedResponse<T> = {
  items: T[]
  total?: number
  page?: number
  size?: number
  pages?: number
}
