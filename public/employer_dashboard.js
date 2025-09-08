function updateStats() {
      fetch("/api/employer/job_stats")
        .then(res => res.json())
        .then(data => {
          document.getElementById("jobsPostedCount").textContent = data.jobsPosted || 0;
          document.getElementById("activeJobsCount").textContent = data.activeJobs || 0;
          document.getElementById("applicationsCount").textContent = data.applications || 0;
        })
        .catch(err => console.error("Failed to load stats:", err));
    }
    updateStats();



  document.getElementById("mediaForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const saveMessage = document.getElementById("saveMessage");

  try {
    const res = await fetch("/api/employer/media", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (res.ok && data.success) {
      saveMessage.style.display = "block";
      saveMessage.style.color = "green";
      saveMessage.innerText = "Location posted successfully!";
      this.reset(); // clear form
    } else {
      saveMessage.style.display = "block";
      saveMessage.style.color = "red";
      saveMessage.innerText = "Failed to post: " + (data.error || "Unknown error");
    }
  } catch (err) {
    console.error("POST ERROR:", err);
    saveMessage.style.display = "block";
    saveMessage.style.color = "red";
    saveMessage.innerText = "Error posting location";
  }
});