terraform {
  backend "gcs" {
    bucket  = "sample-monk-terraform-state"
    prefix  = "prod/state"
  }
}
