let applicantsData = []; // global storage

// Load applicants for a job
async function loadApplicants(jobId) {
  try {
    const res = await fetch(`/api/job_applicants?jobId=${jobId}`);
    const applicants = await res.json();

    applicantsData = applicants; // store globally for search
    renderApplicants(applicantsData);
  } catch (err) {
    console.error("Error loading applicants:", err);
    document.getElementById("applicantsBody").innerHTML =
      `<tr><td colspan="9" style="text-align:center;">Failed to load applicants</td></tr>`;
  }
}

// Render applicants table
function renderApplicants(applicants) {
  const tbody = document.getElementById("applicantsBody");
  tbody.innerHTML = "";

  if (!applicants || applicants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No applicants found</td></tr>`;
    return;
  }

  applicants.forEach(app => {
    const tr = document.createElement("tr");
    tr.id = `row-${app.id}`;

    // Set row color based on status
    if (app.status === "Accepted") tr.style.backgroundColor = "#7cf799ff"; // green
    else if (app.status === "Unsuccessful") tr.style.backgroundColor = "#f8616dff"; // red

    const isDisabled = app.status === "Accepted" || app.status === "Unsuccessful" ? "disabled" : "";

    tr.innerHTML = `
      <td>${app.seeker_name || (app.firstName + " " + app.lastName)}</td>
      <td>${app.job_title || "N/A"}</td>
      <td>${app.seeker_email || app.email}</td>
      <td>${app.seeker_phone || app.phone || "N/A"}</td>
      <td>${new Date(app.applied_at || app.appliedDate).toLocaleDateString()}</td>
      <td>${app.cv ? `<a href="/uploads/2/${app.cv}" target="_blank">View CV</a>` : "No CV"}</td>
      <td>${app.video ? `<a href="#" onclick="viewVideos('${app.video}')">View Videos</a>` : "No Videos"}</td>
      <td>${app.pictures ? `<a href="#" onclick="viewPictures('${app.pictures}')">View Images</a>` : "No Pictures"}</td>
      <td>
        <button class="btn accept-btn" onclick="acceptApplicant(${app.id}, this)" ${isDisabled}>Accept</button>
        <button class="btn delete-btn" onclick="declineApplicant(${app.id}, this)" ${isDisabled}>Decline</button>
      </td>
    `;
    tbody.prepend(tr);
  });
}

// === Pictures Gallery ===
function viewPictures(pictures) {
  if (!pictures) return;

  const picsArray = pictures.split(",");
  const galleryHTML = `
    <html>
      <head>
        <title>Applicant Pictures</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .gallery { display: flex; flex-wrap: wrap; gap: 10px; }
          .gallery img { max-width: 200px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        </style>
      </head>
      <body>
        <h2>Applicant Pictures</h2>
        <div class="gallery">
          ${picsArray.map(pic => `<img src="/uploads/2/${pic.trim()}" alt="picture">`).join("")}
        </div>
      </body>
    </html>
  `;
  const newWindow = window.open("", "_blank");
  newWindow.document.write(galleryHTML);
  newWindow.document.close();
}

// === Videos Gallery ===
function viewVideos(videos) {
  if (!videos) return;

  const vidsArray = videos.split(",");
  const galleryHTML = `
    <html>
      <head>
        <title>Applicant Videos</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .gallery { display: flex; flex-direction: column; gap: 20px; }
          video { max-width: 600px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        </style>
      </head>
      <body>
        <h2>Applicant Videos</h2>
        <div class="gallery">
          ${vidsArray.map(vid => `
            <video controls>
              <source src="/uploads/2/${vid.trim()}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          `).join("")}
        </div>
      </body>
    </html>
  `;
  const newWindow = window.open("", "_blank");
  newWindow.document.write(galleryHTML);
  newWindow.document.close();
}

// Accept action
function acceptApplicant(applicationId, buttonElement) {
  const modal = document.getElementById("confirmModal");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");
  const confirmText = document.getElementById("confirmText");

  confirmText.textContent = "Mark this applicant as Successful?";
  modal.style.display = "flex";

  confirmYes.onclick = () => {
    modal.style.display = "none";

    fetch(`/api/applicant/accept/${applicationId}`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          const row = buttonElement.closest("tr");
          if (row) {
            row.style.backgroundColor = "#00ff3cff"; // green
            row.querySelectorAll("button").forEach(btn => btn.disabled = true);
          }
        } else {
          alert(data.message || "Something went wrong accepting.");
        }
      })
      .catch(err => {
        console.error("Accept error:", err);
        alert("Something went wrong accepting.");
      });
  };

  confirmNo.onclick = () => {
    modal.style.display = "none";
  };
}

// Decline action
function declineApplicant(applicationId, buttonElement) {
  const modal = document.getElementById("confirmModal");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");
  const confirmText = document.getElementById("confirmText");

  confirmText.textContent = "Mark this applicant as Unsuccessful?";
  modal.style.display = "flex";

  confirmYes.onclick = () => {
    modal.style.display = "none";

    fetch(`/api/applicant/decline/${applicationId}`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          const row = buttonElement.closest("tr");
          if (row) {
            row.style.backgroundColor = "#ff0015ff"; // red
            row.querySelectorAll("button").forEach(btn => btn.disabled = true);
          }
        } else {
          alert(data.message || "Something went wrong declining.");
        }
      })
      .catch(err => {
        console.error("Decline error:", err);
        alert("Something went wrong declining.");
      });
  };

  confirmNo.onclick = () => {
    modal.style.display = "none";
  };
}

// Search function
function searchApplicants() {
  const term = searchInput.value.toLowerCase();
  const filtered = applicantsData.filter(app =>
    (app.seeker_name || (app.firstName + " " + app.lastName)).toLowerCase().includes(term) ||
    (app.seeker_email || app.email).toLowerCase().includes(term)
  );
  renderApplicants(filtered);
}

const searchInput = document.getElementById("jobSearch");
const searchBtn = document.getElementById("searchBtn");

searchBtn.addEventListener("click", searchApplicants);
searchInput.addEventListener("keyup", e => {
  if (e.key === "Enter") searchApplicants();
});

// Initially load applicants
loadApplicants();
