/* réactions multi-étiquettes */

const SUPABASE_URL = "https://zmcemvepmmawriilblky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fYNIKzORfbNwReKtP_PFDw_XFo0ueLF";

let supabase = null;

export async function init() {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  await ensureSession();

  const topicEl = document.querySelector("[data-topic-id]");
  const topicId = topicEl && topicEl.dataset.topicId;
  const adminMount = document.getElementById("pmf-reactions-admin");
  const postEls = [...document.querySelectorAll(".pmf-post__reactions[data-post-id]")];

  if (!topicId || (!postEls.length && !adminMount)) return;

  const types = await fetchEnabledTypes(topicId);

  if (postEls.length) {
    const postIds = postEls.map((el) => el.dataset.postId);
    const [counts, mine] = await Promise.all([fetchCounts(postIds), fetchMine(postIds)]);
    postEls.forEach((el) => renderPost(el, types, counts, mine));
  }

  if (adminMount) initAdminPanel(adminMount, topicId);
}

async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await supabase.auth.signInAnonymously();
  }
}

async function fetchEnabledTypes(topicId) {
  const { data, error } = await supabase
    .from("topic_reactions_enabled")
    .select("reaction_type_id, reaction_types(id, label, icon, sort_order)")
    .eq("topic_id", topicId);
  if (error || !data) return [];
  return data
    .map((row) => row.reaction_types)
    .filter(Boolean)
    .sort((a, b) => a.sort_order - b.sort_order);
}

async function fetchCounts(postIds) {
  const { data } = await supabase
    .from("post_reaction_counts")
    .select("post_id, reaction_type_id, total")
    .in("post_id", postIds);
  const map = {};
  (data || []).forEach((row) => {
    map[row.post_id] = map[row.post_id] || {};
    map[row.post_id][row.reaction_type_id] = row.total;
  });
  return map;
}

async function fetchMine(postIds) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData && userData.user && userData.user.id;
  if (!uid) return {};
  const { data } = await supabase
    .from("post_reactions")
    .select("post_id, reaction_type_id")
    .in("post_id", postIds)
    .eq("voter_id", uid);
  const map = {};
  (data || []).forEach((row) => {
    map[row.post_id] = map[row.post_id] || new Set();
    map[row.post_id].add(row.reaction_type_id);
  });
  return map;
}

function renderPost(container, types, counts, mine) {
  const postId = container.dataset.postId;
  container.innerHTML = "";
  types.forEach((type) => {
    const count = (counts[postId] && counts[postId][type.id]) || 0;
    const active = !!(mine[postId] && mine[postId].has(type.id));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pmf-post__reaction-btn" + (active ? " is-active" : "");
    btn.dataset.reactionType = type.id;
    btn.innerHTML =
      '<i icon-mask="' + type.icon + '"></i><span>' + type.label + '</span>' +
      '<span class="rep-nb">' + (count || "") + "</span>";
    btn.addEventListener("click", () => toggleReaction(btn, postId, type.id));
    container.appendChild(btn);
  });
}

async function toggleReaction(btn, postId, typeId) {
  btn.disabled = true;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData && userData.user && userData.user.id;
  if (!uid) {
    btn.disabled = false;
    return;
  }

  const nbEl = btn.querySelector(".rep-nb");
  const current = parseInt(nbEl.textContent, 10) || 0;

  if (btn.classList.contains("is-active")) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("reaction_type_id", typeId)
      .eq("voter_id", uid);
    if (!error) {
      btn.classList.remove("is-active");
      nbEl.textContent = current > 1 ? current - 1 : "";
    }
  } else {
    const { error } = await supabase
      .from("post_reactions")
      .insert({ post_id: postId, reaction_type_id: typeId });
    if (!error) {
      btn.classList.add("is-active");
      nbEl.textContent = current + 1;
    }
  }
  btn.disabled = false;
}

// Panneau admin — config des étiquettes actives sur ce topic

function initAdminPanel(mount, topicId) {
  mount.innerHTML = "";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pmf-reactions-admin__toggle";
  toggle.innerHTML = '<i icon-mask="edit"></i><span>Réactions du topic</span>';

  const panel = document.createElement("div");
  panel.className = "pmf-reactions-admin__panel";
  panel.hidden = true;

  toggle.addEventListener("click", async () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) await renderAdminPanel(panel, topicId);
  });

  mount.append(toggle, panel);
}

async function renderAdminPanel(panel, topicId) {
  panel.innerHTML = "";
  const { data: userData } = await supabase.auth.getUser();
  const isRealAccount = userData && userData.user && !userData.user.is_anonymous;

  if (!isRealAccount) {
    renderLoginForm(panel, topicId);
    return;
  }

  const [{ data: allTypes }, { data: enabled }] = await Promise.all([
    supabase.from("reaction_types").select("*").order("sort_order"),
    supabase.from("topic_reactions_enabled").select("reaction_type_id").eq("topic_id", topicId),
  ]);
  const enabledIds = new Set((enabled || []).map((r) => r.reaction_type_id));

  (allTypes || []).forEach((type) => {
    const label = document.createElement("label");
    label.className = "pmf-reactions-admin__option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabledIds.has(type.id);
    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      if (checkbox.checked) {
        await supabase.from("topic_reactions_enabled").insert({ topic_id: topicId, reaction_type_id: type.id });
      } else {
        await supabase
          .from("topic_reactions_enabled")
          .delete()
          .eq("topic_id", topicId)
          .eq("reaction_type_id", type.id);
      }
      checkbox.disabled = false;
    });

    label.append(checkbox, document.createTextNode(" " + type.label));
    panel.appendChild(label);
  });
}

function renderLoginForm(panel, topicId) {
  const form = document.createElement("form");
  form.className = "pmf-reactions-admin__login";
  form.innerHTML =
    '<input type="email" name="email" placeholder="Email" class="pmf-input" required />' +
    '<input type="password" name="password" placeholder="Mot de passe" class="pmf-input" required />' +
    '<button type="submit" class="pmf-btn pmf-btn--accent">Connexion</button>' +
    '<span class="pmf-reactions-admin__error"></span>';

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.value,
      password: form.password.value,
    });
    if (error) {
      form.querySelector(".pmf-reactions-admin__error").textContent = "Échec de connexion.";
    } else {
      await renderAdminPanel(panel, topicId);
    }
  });

  panel.appendChild(form);
}
