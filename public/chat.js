// DOM Elements
const sendBtn = document.getElementById("sendButton");
const clearBtn = document.getElementById("clearButton");
const messageInput = document.getElementById("userMessage");
const chatContainer = document.getElementById("chatContainer");
const cvUpload = document.getElementById("cvUpload");
const analyzeCVBtn = document.getElementById("analyzeCVBtn");

// ----------------------
// Helper Functions
// ----------------------

// Append message to chat
function appendMessage(text, sender, temp = false) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.innerText = text;
  if (temp) msgDiv.dataset.temp = "true";
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  saveChatToLocalStorage();
}

// Update last temporary AI message
function updateLastAIMessage(newText) {
  const lastTemp = chatContainer.querySelector(".message.ai[data-temp='true']");
  if (lastTemp) {
    lastTemp.innerText = newText;
    lastTemp.removeAttribute("data-temp");
  } else {
    appendMessage(newText, "ai");
  }
  saveChatToLocalStorage();
}

// Save chat to localStorage
function saveChatToLocalStorage() {
  const messages = [...chatContainer.querySelectorAll(".message")].map(msg => ({
    text: msg.innerText,
    sender: msg.classList.contains("ai") ? "ai" : "user",
    temp: msg.dataset.temp === "true"
  }));
  localStorage.setItem("chatHistory", JSON.stringify(messages));
}

// Load chat from localStorage
function loadChatFromLocalStorage() {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  history.forEach(msg => appendMessage(msg.text, msg.sender, msg.temp));
}

// Clear chat
async function clearChat() {
  if (!confirm("Are you sure you want to clear the chat?")) return;

  chatContainer.innerHTML = "";
  localStorage.removeItem("chatHistory");

  try {
    await fetch("/api/ai/chat/clear", { method: "POST", credentials: "include" });
  } catch (err) {
    console.error("Error clearing backend chat:", err);
  }
}

// ----------------------
// Event Listeners
// ----------------------

// Send message
sendBtn.onclick = async () => {
  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  messageInput.value = "";

  appendMessage("Thinking...", "ai", true);

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      credentials: "include"
    });
    const data = await res.json();
    updateLastAIMessage(data.reply);
  } catch (err) {
    console.error("Error calling AI:", err);
    updateLastAIMessage("Error connecting to AI.");
  }
};

// Send on Enter key
messageInput.addEventListener("keypress", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Clear chat button
clearBtn.onclick = clearChat;

// ----------------------
// CV Upload integrated into chat
// ----------------------

// Trigger hidden file input when button is clicked
analyzeCVBtn.onclick = () => {
  cvUpload.click();
};

// ----------------------
// Initialize chat on page load
// ----------------------
window.addEventListener("load", async () => {
  loadChatFromLocalStorage();

  if (!localStorage.getItem("chatHistory")) {
    try {
      const res = await fetch("/api/ai/chat/history", { credentials: "include" });
      const data = await res.json();
      if (data.history) {
        chatContainer.innerHTML = "";
        data.history.forEach(msg => appendMessage(msg.text, msg.sender));
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  }
});


cvUpload.addEventListener("change", async () => {
  const file = cvUpload.files[0];
  if (!file) return;

  // Show file uploaded message
  appendMessage(`File uploaded: ${file.name}`, "user");

  // Show analyzing message
  appendMessage("Analyzing CV...", "ai", true);

  const formData = new FormData();
  formData.append("cv", file);

  try {
    const res = await fetch("/api/ai/analyze-cv", {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const data = await res.json();
    console.log("CV analysis response:", data); // log here inside try block

    if (data && (data.strengths?.length || data.weaknesses?.length || data.improvements?.length)) {
      let reply = "";

      if (data.strengths?.length) {
        reply += `💪 Strengths:\n- ${data.strengths.join("\n- ")}\n\n`;
      }
      if (data.weaknesses?.length) {
        reply += `⚠️ Weaknesses:\n- ${data.weaknesses.join("\n- ")}\n\n`;
      }
      if (data.improvements?.length) {
        reply += `✨ Improvements:\n- ${data.improvements.join("\n- ")}`;
      }

      updateLastAIMessage(reply.trim());
    } else {
      console.warn("No suggestions found in response:", data);
      updateLastAIMessage("No suggestions found.");
    }
  } catch (err) {
    console.error("Error analyzing CV:", err);
    updateLastAIMessage("Error analyzing CV.");
  }
});
