variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The deployment region"
  type        = string
  default     = "europe-west1"
}

variable "app_url" {
  description = "The public application URL for CORS origin allowlist"
  type        = string
  default     = ""
}
