output "signaling_service_url" {
  value = google_cloud_run_v2_service.signaling_service.uri
}

output "backend_service_url" {
  value = google_cloud_run_v2_service.backend_service.uri
}
