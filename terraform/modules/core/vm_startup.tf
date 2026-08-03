# Sets the vm-startup.sh script as the default GCP project-level startup script.
# Every GCE VM created in this project inherits it automatically at boot –
# no manual configuration required.
#
# The script installs a systemd timer that monitors idle time (no SSH sessions,
# CPU < 5 %) and shuts the VM down after 30 minutes of inactivity.

data "local_file" "vm_startup_script" {
  filename = "${path.module}/../../../scripts/vm-startup.sh"
}

resource "google_compute_project_metadata_item" "vm_startup_script" {
  project = var.project_id
  key     = "startup-script"
  value   = data.local_file.vm_startup_script.content
}
