const urlParams = new URLSearchParams(window.location.search);
const youthId = urlParams.get("id");

    fetch(`/api/youth_profile/${youthId}`)
      .then(res => res.json())
      .then(profile => {
        if (profile.error) {
          document.getElementById("profileDetails").innerText = profile.error;
          return;
        }

        document.getElementById("profileDetails").innerHTML = `
          <p><b>Name:</b> ${profile.first_name} ${profile.last_name}</p>
          <p><b>Email:</b> ${profile.email}</p>
          <p><b>Phone:</b> ${profile.phone}</p>
          <p><b>DOB:</b> ${profile.dob}</p>
          <p><b>Gender:</b> ${profile.gender}</p>
          <p><b>Location:</b> ${profile.location}</p>
          <p><b>Education:</b> ${profile.education_level} - ${profile.highest_grade}</p>
          <p><b>Courses:</b> ${profile.courses}</p>
          <p><b>Skills:</b> ${profile.skills}</p>
          <p><b>Languages:</b> ${profile.languages}</p>
          <p><b>Experience:</b> ${profile.experience}</p>
          <p><b>Availability:</b> ${profile.availability}</p>
          <p><b>Work Type:</b> ${profile.work_type}</p>
          <p><b>Transport:</b> ${profile.transport}</p>
          <p><b>Extra Info:</b> ${profile.extra_info}</p>
        `;
      })
      .catch(err => {
        document.getElementById("profileDetails").innerText = "Error loading profile";
    });