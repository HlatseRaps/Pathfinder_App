async function loadJobs() {
    const response = await fetch("http://localhost:3000/jobs");
    const jobs = await response.json();
    const container = document.getElementById("jobs-container");
    container.innerHTML = "";

    jobs.forEach(job => {
        const jobCard = document.createElement("div");
        jobCard.classList.add("job-card-item");
        jobCard.innerHTML = `
            <h4>${job.title}</h4>
            <p>${job.description}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Type:</strong> ${job.type}</p>
            <p><strong>Salary:</strong> ${job.salary ? "R" + job.salary : "Not specified"}</p>
            <small>Posted on: ${new Date(job.created_at).toLocaleDateString()}</small>
            <button onclick='showJobDetails(${JSON.stringify(job)})'>View Details</button>
        `;
        container.appendChild(jobCard);
    });
}
loadJobs();

// Search function
const searchInput = document.getElementById("jobSearch");
const searchBtn = document.getElementById("searchBtn");

function filterJobs() {
  const term = searchInput.value.toLowerCase().trim();
  const jobCards = document.querySelectorAll(".job-card-item");
  let anyVisible = false;

  jobCards.forEach(card => {
    const title = card.querySelector("h4").innerText.toLowerCase();
    const description = card.querySelector("p").innerText.toLowerCase();
    const location = card.querySelector("p:nth-of-type(2)").innerText.toLowerCase();
    const type = card.querySelector("p:nth-of-type(3)").innerText.toLowerCase();

    if(title.includes(term) || description.includes(term) || location.includes(term) || type.includes(term)){
      card.style.display = "flex";
      anyVisible = true;
    } else {
      card.style.display = "none";
    }
  });

  let noResults = document.getElementById("noResultsMessage");
  if(!noResults){
    noResults = document.createElement("p");
    noResults.id = "noResultsMessage";
    noResults.style.color = "red";
    noResults.style.fontWeight = "bold";
    noResults.style.textAlign = "center";
    noResults.style.marginTop = "1em";
    document.getElementById("jobs-container").parentNode.appendChild(noResults);
  }
  noResults.textContent = anyVisible ? "" : "No jobs found matching your search.";
}

searchBtn.addEventListener("click", filterJobs);
searchInput.addEventListener("input", filterJobs);


// Modal functions
let selectedJobId = null;
function showJobDetails(job){
    selectedJobId = job.id;
    document.getElementById("modalJobTitle").textContent = job.title;
    document.getElementById("modalJobDescription").textContent = job.description;
    const extraInfo = job.extraInfo 
      ? job.extraInfo.replace(/\n/g,"<br><br>") 
      : "No extra information provided.";

    document.getElementById("modalJobExtraInfo").innerHTML = extraInfo;

    document.getElementById("jobDetailsModal").style.display = "block";
}


function closeJobDetails(){
    document.getElementById("jobDetailsModal").style.display = "none";
}


function openApplyModal(jobId) {
  document.getElementById("applyJobId").value = jobId;
  document.getElementById("applyModal").style.display = "flex";
}

function closeApplyModal() {
  document.getElementById("applyModal").style.display = "none";
}

// Handle Apply Form Submit
document.getElementById("applyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const res = await fetch("/apply_job", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      alert("Application submitted successfully!");
      closeApplyModal();
      closeJobDetails();
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while submitting.");
  }
});
