module "core" {
  source     = "../../modules/core"
  project_id = var.project_id
  region     = var.region
}

variable "project_id" { type = string }
variable "region" { type = string }
