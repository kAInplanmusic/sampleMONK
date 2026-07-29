resource "google_cloud_run_v2_service" "signaling_service" {
  name     = "signaling-service"
  location = var.region

  template {
    service_account = google_service_account.cloud_run_sa.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.sample_monk_repo.name}/signaling:latest"
    }
  }
}

resource "google_cloud_run_v2_service" "backend_service" {
  name     = "audio-backend"
  location = var.region

  template {
    service_account = google_service_account.cloud_run_sa.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.sample_monk_repo.name}/audio-backend:latest"
    }
  }
}
