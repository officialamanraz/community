// src/api/api.js
//
// Centralized API helper.
// Base URL comes from .env: VITE_API_URL=http://localhost:3000
// (must start with VITE_ or Vite won't expose it to the browser)
//
// Route prefixes below match server.js exactly:
//   /sign, /rooms, /posts, /comments, /likes, /messages, /reports
// (no /api prefix anywhere in this backend)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  // 1. Pehle custom headers le lo
  const headers = {
    ...(options.headers || {}),
  };

  // 2. SMART CHECK: Content-Type sirf tab lagao jab data FormData NA ho
  if (!(options.body instanceof FormData)) {
    // Agar body mein application/json ya kuch define nahi hai toh default set karo
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  } else {
    // Ensure FormData hone par header delete ho jaye taaki browser handle kare
    delete headers["Content-Type"];
  }

  // 3. Token attach karo (agar hai toh)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 4. Request bhejo
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 5. Error handling
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Something went wrong");
  }

  return response;
}

// For multipart/form-data uploads (images) - don't set Content-Type manually,
// the browser sets the correct multipart boundary itself.
export async function apiFetchForm(endpoint, formData, method = "POST") {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Something went wrong");
  }
  
  return response;
}

// ---------- AUTH (mounted at /sign in server.js) ----------
export const signup = async (data) => {
    const response = await apiFetchForm('/sign/signup', data, 'POST');
    const responseData = await response.json();

    if (responseData.token) {
        localStorage.setItem("token", responseData.token);
        const idFromResponse = responseData.user?.id ?? responseData.user?.user_id;
        const idFromToken = JSON.parse(atob(responseData.token.split('.')[1])).user_id;

        const normalizedUser = {
            user_id: idFromResponse ?? idFromToken,
            name: responseData.user?.name,
            role: responseData.user?.role
        };
        localStorage.setItem("user", JSON.stringify(normalizedUser));
    }

    return responseData;
};

export const login = async ({ email, password }) => {
    const response = await apiFetch("/sign/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
        localStorage.setItem("token", data.token);
        const idFromResponse = data.user?.id ?? data.user?.user_id;
        const idFromToken = JSON.parse(atob(data.token.split('.')[1])).user_id;

        const normalizedUser = {
            user_id: idFromResponse ?? idFromToken,
            name: data.user?.name,
            role: data.user?.role
        };
        localStorage.setItem("user", JSON.stringify(normalizedUser));
    }
    return data;
};
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

// ---------- ROOMS (mounted at /rooms) ----------
export const getAllRooms = async () => {
  const response = await apiFetch("/rooms");
  return await response.json();
};

export const getRoomById = async (room_id) => {
  const response = await apiFetch(`/rooms/${room_id}`);
  return await response.json();
};

export const createRoom = async (formData) => {
  // formData should contain room_name + image, built by the component
  const response = await apiFetchForm("/rooms", formData, "POST");
  return await response.json();
};

// ---------- POSTS (mounted at /posts) ----------
export const getPostsByRoom = async (room_id) => {
  const response = await apiFetch(`/posts/room/${room_id}`);
  return await response.json();
};

export const getPostById = async (post_id) => {
  const response = await apiFetch(`/posts/${post_id}`);
  return await response.json();
};

export const createPost = async (room_id, formData) => {
  const response = await apiFetchForm(`/posts/${room_id}`, formData, "POST");
  return await response.json();
};

export const deletePost = async (post_id) => {
  const response = await apiFetch(`/posts/${post_id}`, { method: "DELETE" });
  return await response.json();
};

// ---------- COMMENTS (mounted at /comments) ------// ---------- COMMENTS ----------
export const getComments = async (target_type, target_id) => {
  const response = await apiFetch(`/comments/${target_type}/${target_id}`);
  return await response.json();
};

export const createComment = async (target_type, target_id, content, parent_comment_id = null) => {
  const response = await apiFetch(`/comments/${target_type}/${target_id}`, {
    method: "POST",
    body: JSON.stringify({ content, parent_comment_id }),
  });
  return await response.json();
};

export const deleteComment = async (comment_id) => {
  const response = await apiFetch(`/comments/${comment_id}`, { method: "DELETE" });
  return await response.json();
};
/** 
 * @params {string} targetType
 * @params {number} targetId
 */
export const toggellike = async (targetType, targetId) => {
  try {
    const response = await apiFetch('/likes', {
      method: 'POST',
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("error toggling likes:", error);
    throw error;
  }
};

// ---------- MESSAGES (mounted at /messages) ----------
export const getMessagesByRoom = async (room_id) => {
  const response = await apiFetch(`/messages/${room_id}`);
  return await response.json();
};

export const createMessage = async (room_id, content) => {
  const response = await apiFetch(`/messages/${room_id}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return await response.json();
};

// ---------- REPORTS (mounted at /reports) ----------
export const createReport = async ({ item_type, item_id, reason }) => {
  const response = await apiFetch("/reports", {
    method: "POST",
    body: JSON.stringify({ item_type, item_id, reason }),
  });
  return await response.json();
};

export const getAllReports = async () => {
  const response = await apiFetch("/reports");
  return await response.json();
};

// ---------- PROFILE (mounted at /profile) ----------
export const getUserProfile = async (user_id) => {
    const response = await apiFetch(`/profile/${user_id}`);
    return await response.json();
};

export const updateProfile = async (formData) => {
    const response = await apiFetchForm('/profile/update', formData, 'PUT');
    return await response.json();
};

export const toggleFollow = async (following_id) => {
    const response = await apiFetch(`/profile/follow/${following_id}`, { method: "POST" });
    return await response.json();
};

export const getUserPosts = async (user_id) => {
    const response = await apiFetch(`/profile/${user_id}/posts`);
    return await response.json();
};

// ---------- BANNERS ----------
export const getHomeBanner = async () => {
    const response = await fetch(`${API_BASE_URL}/banners/home`);
    return await response.json();
};

export const updateHomeBanner = async (formData) => {
    const response = await apiFetchForm('/banners/home', formData, 'PUT');
    return await response.json();
};

export const updateRoomBanner = async (room_id, formData) => {
    const response = await apiFetchForm(`/rooms/${room_id}/banner`, formData, 'PUT');
    return await response.json();
};

// POST request to create the banner for the first time
export const createHomeBanner = async (formData) => {
    const response = await apiFetchForm('/banners/home', formData);
    return await response.json();
};