/* ============================================================
   GEM Crispy Confectionaries — Newsletter Signup
   Submits to the Supabase Edge Function `subscribe-newsletter`,
   which stores the subscriber and adds them to a Brevo list.
   ============================================================ */

(function () {
  "use strict";

  var config = window.GEM_CONFIG || {};

  document.querySelectorAll("[data-newsletter-form]").forEach(function (form) {
    var input = form.querySelector("input[type='email']");
    var noteEl = form.parentElement.querySelector("[data-form-note]");
    var submitBtn = form.querySelector("button[type='submit']");

    function setNote(message, type) {
      if (!noteEl) return;
      noteEl.textContent = message;
      noteEl.className = "form-note" + (type ? " is-" + type : "");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = input.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setNote("Please enter a valid email address.", "error");
        return;
      }

      if (!config.SUPABASE_URL || config.SUPABASE_URL.indexOf("YOUR-PROJECT-REF") !== -1) {
        setNote("Newsletter isn't connected yet — add your Supabase project details in js/config.js.", "error");
        return;
      }

      submitBtn.disabled = true;
      var originalText = submitBtn.textContent;
      submitBtn.textContent = "Joining…";

      fetch(config.SUPABASE_URL + "/functions/v1/subscribe-newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": config.SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + config.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: email }),
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed");
          return response.json();
        })
        .then(function () {
          setNote("You're in! Watch your inbox for GEM offers and flavor drops.", "success");
          form.reset();
        })
        .catch(function () {
          setNote("Something went wrong. Please try again in a moment.", "error");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    });
  });
})();
