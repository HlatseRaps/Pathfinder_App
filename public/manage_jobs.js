fetch("/api/employer/jobs")
  .then(res => res.json())
  .then(jobs => {
    const jobsContainer = document.getElementById("jobsContainer");
    jobsContainer.innerHTML = ""; // clear placeholder

    if (jobs.length === 0) {
      jobsContainer.innerHTML = "<p>No jobs posted yet.</p>";
      return;
    }

      jobs.forEach(job => {
        const jobItem = document.createElement("div");
        jobItem.classList.add("job-item");

        jobItem.innerHTML = `
          <div class="job-info">
            <h3>${job.title}</h3>
            <p>${job.description}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Type:</strong> ${job.type}</p>
            <p><strong>Salary: R</strong> ${job.salary || "Not specified"}</p>
          </div>
          <div class="job-actions">
            <button class="edit-btn" onclick="editJob(${job.id})">Edit</button>
            <button class="delete-btn" onclick="deleteJob(${job.id})">Delete</button>
          </div>
        `;
        jobItem.querySelector(".edit-btn").addEventListener("click", () => editJob(job));
        jobItem.querySelector(".delete-btn").addEventListener("click", () => deleteJob(job.id));

        jobsContainer.appendChild(jobItem);
      });

  })
  .catch(err => console.error("Error loading jobs:", err));
    



const modal = document.getElementById("editJobModal");
const closeModal = document.querySelector(".modal .close");
const editForm = document.getElementById("editJobForm");

// Open modal and fill data
function editJob(job) {
  modal.style.display = "block";
  document.getElementById("editJobId").value = job.id;
  document.getElementById("editTitle").value = job.title;
  document.getElementById("editDescription").value = job.description;
  document.getElementById("editLocation").value = job.location;
  document.getElementById("editType").value = job.type;
  document.getElementById("editSalary").value = job.salary;
}

// Close modal
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if(e.target == modal) modal.style.display = "none"; };

editForm.addEventListener("submit", function(e) {
  e.preventDefault();
  
  const jobId = document.getElementById("editJobId").value;
  const title = document.getElementById("editTitle").value;
  const description = document.getElementById("editDescription").value;
  const location = document.getElementById("editLocation").value;
  const type = document.getElementById("editType").value;
  const salary = document.getElementById("editSalary").value;

  fetch("/edit_job", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ jobId, title, description, location, type, salary })
  })
  .then(res => res.json())
  .then(data => {
    if(data.success) {
      // 1️⃣ Update the job in the DOM
      const jobItem = document.querySelector(`#job-${jobId}`);
      if(jobItem) {
        jobItem.querySelector(".job-info h3").textContent = title;
        const pTags = jobItem.querySelectorAll(".job-info p");
        pTags[0].textContent = description;
        pTags[1].innerHTML = `<strong>Location:</strong> ${location}`;
        pTags[2].innerHTML = `<strong>Type:</strong> ${type}`;
        pTags[3].innerHTML = `<strong>Salary:</strong> ${salary || "Not specified"}`;
      }

      // 2️⃣ Close the modal
      modal.style.display = "none";
    } else {
      alert("Failed to update job");
    }
  });
});

// Delete job
function deleteJob(jobId) {
  if (!confirm("You are deleting the job.")) return;
  fetch(`/delete_job/${jobId}`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      if (data.success) location.reload();
      else alert("Failed to delete job");
    });
}