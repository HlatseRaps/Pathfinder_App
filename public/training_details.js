// get course from query string
    const params = new URLSearchParams(window.location.search);
    const course = params.get("course");

    // show correct details
    const details = {
      hospitality_basics: {
        title: "Hospitality Basics",
        description: "This course teaches you the core principles of working in the hospitality industry.",
        points: [
              "Customer service essentials",
              "Professional hygiene standards",
              "Team collaboration",
              "Delivering excellent guest experiences"
        ]
      },
      Communication_skills: {
        title: "Communication Skills",
            description: "Develop professional communication and conflict management techniques.",
            points: [
              "Verbal and non-verbal communication",
              "Conflict resolution",
              "Teamwork communication",
              "Building rapport with clients"
            ]
      },
      food: {
        title: "Food Safety & Hygiene",
            description: "Learn how to handle food safely and maintain hygiene in restaurants and hotels.",
            points: [
              "Food handling practices",
              "Cross-contamination prevention",
              "Health & safety regulations",
              "Personal hygiene for food handlers"
            ]
      },
      customer_service: {
        title: "Advanced Customer Service",
            description: "Go beyond the basics and master the art of handling complex customer situations.",
            points: [
              "Managing complaints",
              "Resolving conflicts",
              "Creating memorable experiences",
              "Upselling with empathy"
            ]
      },
       visual_practice: {
        title: "Interview Mindset & Preparation",
            description: "Building confidence by researching the role, practicing responses, and approaching the interview with a professional attitude.",
            points: [
              "Researching the company and role",
              "Practicing common interview questions",
              "Developing clear, confident body language",
              "Preparing thoughtful questions for the interviewer"
            ]
        }
    };
   

    if (course && details[course]) {
      document.getElementById("courseTitle").textContent = details[course].title;
      document.getElementById("courseDescription").textContent = details[course].description;
      document.getElementById("trainingPoints").textContent = details[course].points;

      // link Attempt button to right course page
      document.getElementById("attemptBtn").onclick = () => {
        window.location.href = course + ".html";
      };

      const trainingPointsList = document.getElementById("trainingPoints");

      // Clear old points before adding new ones
      trainingPointsList.innerHTML = "";

      // Loop through the points and add <li> for each
      details[course].points.forEach(point => {
          const li = document.createElement("li");
          li.textContent = point;
          trainingPointsList.appendChild(li);
      });
    }