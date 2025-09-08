async function loadPosts() {
  const container = document.getElementById("postsContainer");
  container.innerHTML = "<p>Loading posts...</p>";

  try {
    const res = await fetch("/api/youth/media", { credentials: 'same-origin' });
    if (!res.ok) {
      // if 401 — not logged in
      if (res.status === 401) {
        container.innerHTML = "<p>Please log in to see your posts.</p>";
      } else {
        const err = await res.json().catch(()=>({}));
        container.innerHTML = `<p>Error loading posts: ${err.error || res.statusText}</p>`;
      }
      return;
    }

    const posts = await res.json();
    if (!posts || posts.length === 0) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    container.innerHTML = "";
    posts.forEach(post => {
      const div = document.createElement("div");
      div.className = "post-card";
      // images/videos might be empty strings
      const picsHtml = post.pictures ? post.pictures.split(',').map(f => `<img class="post-media-img" src="/uploads/${post.youth_id}/${f}" />`).join('') : '';
      const vidsHtml = post.videos ? post.videos.split(',').map(f => `<video class="post-media-vid" controls src="/uploads/${post.youth_id}/${f}"></video>`).join('') : '';

      div.innerHTML = `
        <div class="post-header">
          <h3>${escapeHtml(post.first_name || '')} ${escapeHtml(post.last_name || '')}</h3>
          <small>${new Date(post.created_at).toLocaleString()}</small>
        </div>
        <div style="margin-bottom:8px">
          <p>${escapeHtml(post.location_name|| '')}</p>
        </div>
        <div style="margin-bottom:8px">
          <p>${escapeHtml(post.city || '')}, ${escapeHtml(post.country || '')}</p>
        </div>
        <p class="sty">${escapeHtml(post.description || '')}</p>
        <p class="sty">${escapeHtml(post.category || '')}</p>
        <div class="post-media">${picsHtml}${vidsHtml}</div>
        <button class="delete-post-btn" data-id="${post.id}">
            <i class="fas fa-trash"></i> Delete
        </button>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading posts.</p>";
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

window.addEventListener('DOMContentLoaded', loadPosts);


document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-post-btn");
  if (btn) {
    const postId = btn.getAttribute("data-id");
    const postElement = btn.closest(".post-card");

    if (confirm("Are you sure you want to delete this post?")) {
      const res = await fetch(`/api/youth/media/${postId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        postElement.remove();
      } else {
        alert(data.error || "Failed to delete post");
      }
    }
  }
});