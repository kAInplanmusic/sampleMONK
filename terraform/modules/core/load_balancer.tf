# NEGs for Cloud Run
resource "google_compute_region_network_endpoint_group" "signaling_neg" {
  name                  = "signaling-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.signaling_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "backend_neg" {
  name                  = "backend-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.backend_service.name
  }
}

# Backend Services
resource "google_compute_backend_service" "signaling_backend" {
  name        = "signaling-backend"
  protocol    = "HTTP"
  backend {
    group = google_compute_region_network_endpoint_group.signaling_neg.id
  }
}

resource "google_compute_backend_service" "backend_service_lb" {
  name        = "backend-service"
  protocol    = "HTTP"
  backend {
    group = google_compute_region_network_endpoint_group.backend_neg.id
  }
}

# URL Map
resource "google_compute_url_map" "default" {
  name            = "sample-monk-url-map"
  default_service = google_compute_backend_service.backend_service_lb.id

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.backend_service_lb.id
    path_rule {
      paths   = ["/signaling/*"]
      service = google_compute_backend_service.signaling_backend.id
    }
  }
}

# Proxy & Forwarding
resource "google_compute_target_http_proxy" "default" {
  name    = "sample-monk-http-proxy"
  url_map = google_compute_url_map.default.id
}

resource "google_compute_global_forwarding_rule" "default" {
  name       = "sample-monk-forwarding-rule"
  target     = google_compute_target_http_proxy.default.id
  port_range = "80"
}
