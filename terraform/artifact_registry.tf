resource "google_artifact_registry_repository" "sample_monk_repo" {
  location      = var.region
  repository_id = "sample-monk-repo"
  format        = "DOCKER"
}
