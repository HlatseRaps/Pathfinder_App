const notificationList = document.getElementById("notificationList");
    const simulateBtn = document.getElementById("simulateBtn");

    // Example notification data generator
    function createNotification(title, message) {
      return {
        id: Date.now().toString(),
        title,
        message,
        timestamp: new Date()
      };
    }

    // Format timestamp nicely (e.g. "Aug 8, 2025 - 11:00 AM")
    function formatTimestamp(date) {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleString(undefined, options);
    }

    // Add notification to the list
    function addNotification(notification) {
      // Remove "no notifications" placeholder if present
      const noNotifElem = document.querySelector(".no-notifications");
      if (noNotifElem) {
        noNotifElem.remove();
      }

      const li = document.createElement("li");
      li.classList.add("notification-item");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-live", "polite");
      li.setAttribute("aria-atomic", "true");
      li.setAttribute("data-id", notification.id);

      li.innerHTML = `
        <span class="notification-icon" aria-hidden="true"><i class="fas fa-info-circle"></i></span>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-text">${notification.message}</div>
          <div class="notification-timestamp">${formatTimestamp(notification.timestamp)}</div>
        </div>
        <button class="notification-close-btn" aria-label="Dismiss notification">&times;</button>
      `;

      // Add close button handler
      li.querySelector(".notification-close-btn").addEventListener("click", () => {
        removeNotification(notification.id);
      });

      // Insert newest notifications on top
      notificationList.prepend(li);
    }

    // Remove notification by ID
    function removeNotification(id) {
      const notifElem = document.querySelector(`li.notification-item[data-id="${id}"]`);
      if (notifElem) {
        notifElem.style.animation = "fadeOutSlide 0.4s forwards";
        notifElem.addEventListener("animationend", () => {
          notifElem.remove();
          // If list empty, add placeholder
          if (notificationList.children.length === 0) {
            const emptyMsg = document.createElement("li");
            emptyMsg.classList.add("no-notifications");
            emptyMsg.textContent = "You have no new notifications.";
            notificationList.appendChild(emptyMsg);
          }
        });
      }
    }

    // Animation for removing
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes fadeOutSlide {
        from {opacity: 1; transform: translateX(0);}
        to {opacity: 0; transform: translateX(20px);}
      }
    `;
    document.head.appendChild(styleSheet);

    // Simulate notification button click
    simulateBtn.addEventListener("click", () => {
      const sampleTitles = [
        "New Job Alert",
        "Skill Test Reminder",
        "Profile Update Successful",
        "Training Program Available",
        "Emails Check"
      ];
      const sampleMessages = [
        "A new hospitality job matching your profile has been posted. Check it out!",
        "Don't forget to complete your skill test by Friday to stay qualified.",
        "Your profile has been updated successfully.",
        "Training courses are available to boost your career.",
        "Kepp on checking your emails for any updates from employers"
      ];

      // Random pick for demo
      const idx = Math.floor(Math.random() * sampleTitles.length);
      const notification = createNotification(sampleTitles[idx], sampleMessages[idx]);
      addNotification(notification);
    });
