resource "google_cloud_run_v2_service" "signaling_service" {
  name     = "signaling-service"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_sa.email
    timeout         = "1800s"
    max_instance_request_concurrency = 100
    
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.sample_monk_repo.name}/signaling:latest"
      
      resources {
        limits = {
          cpu    = "1000m"
          memory = "1Gi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }
      
      env {
        name  = "PORT"
        value = "3001"
      }

      env {
        name  = "SIGNALING_IDLE_TIMEOUT_MS"
        value = "1800000"
      }

      env {
        name  = "SIGNALING_ALLOWED_ORIGINS"
        value = var.app_url
      }
    }
  }
}

resource "google_cloud_run_v2_service" "backend_service" {
  name     = "audio-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_sa.email
    timeout         = "900s"
    max_instance_request_concurrency = 20
    
    scaling {
      min_instance_count = 0
      max_instance_count = 20
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.sample_monk_repo.name}/audio-backend:latest"
      
      resources {
        limits = {
          cpu    = "2000m"
          memory = "4Gi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }
}
