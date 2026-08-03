resource "google_service_account" "cloud_run_sa" {
  account_id   = "sample-monk-runner"
  display_name = "Cloud Run Service Account"
}

resource "google_project_iam_member" "firestore_access" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "secret_access" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Allow the CI/CD service account to enable GCP APIs (needed for cleanup-cloud-shell workflow)
resource "google_project_iam_member" "ci_service_usage_admin" {
  project = var.project_id
  role    = "roles/serviceusage.serviceUsageAdmin"
  member  = "serviceAccount:git-agent@${var.project_id}.iam.gserviceaccount.com"
}
