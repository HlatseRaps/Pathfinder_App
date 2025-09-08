async function loadAppliedJobs() {
  const res = await fetch("/api/my_applications"); 
  const applications = await res.json();

  const tabs = ["applications", "appointed", "unsuccessful"];
  tabs.forEach(tab => document.getElementById(tab).innerHTML = "");

  applications.forEach(job => {
    let targetTab = "applications"; // default
    if (job.status === "Applied") targetTab = "applications";
    else if (job.status === "Appointed" || job.status === "Accepted") targetTab = "appointed";
    else if (job.status === "Unsuccessful") targetTab = "unsuccessful";

    const div = document.createElement("div");
    div.classList.add("job-card");
    
    div.innerHTML = `
      <h3>${job.job_title}</h3>
      <p>${job.description}</p>
      <p><strong>Location:</strong> ${job.location}</p>
      <p><strong>Salary:</strong> ${job.salary ? "R" + job.salary : "Not specified"}</p>
      <p><strong>Applied on:</strong> ${new Date(job.applied_at).toLocaleDateString()}</p>

      ${targetTab === "applications" 
        ? `<button onclick="deleteApplication(${job.application_id})">Delete Application</button>` 
        : ""}
    `;

    document.getElementById(targetTab).appendChild(div);
  });

  // Show "No jobs yet" if tab is empty
  tabs.forEach(tab => {
    const container = document.getElementById(tab);
    if (container.children.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: gray; margin-top: 20px;">No ${tab} yet.</p>`;
    }
  });
}

// Delete only for Applications tab
function deleteApplication(applicationId) {
  if (!confirm("Are you sure you want to delete this application?")) return;

  fetch(`/applications/${applicationId}`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Application deleted successfully!");
        loadAppliedJobs();
      } else {
        alert(data.error || "Something went wrong.");
      }
    })
    .catch(err => {
      console.error("Delete error:", err);
      alert("Something went wrong while deleting.");
    });
}

// Tab navigation
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Initial load
loadAppliedJobs();
