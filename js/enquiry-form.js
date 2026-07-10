/* ============================================================
   GEM Crispy Confectionaries — Contact & Product Enquiry Form
   Submits to the Supabase Edge Function `submit-enquiry`, which
   inserts the lead into Postgres and sends a Brevo notification
   email to the GEM team.
   ============================================================ */

(function () {
  "use strict";

  var form = document.querySelector("[data-enquiry-form]");
  if (!form) return;

  var config = window.GEM_CONFIG || {};
  var noteEl = form.querySelector("[data-form-note]");
  var submitBtn = form.querySelector("[data-submit-btn]");
  var productField = form.querySelector("[name='product_name']");
  var subjectField = form.querySelector("[name='subject']");
  var messageField = form.querySelector("[name='message']");

  // Pre-fill from ?product= query param (set by "Enquire Now" links on the Products page)
  var params = new URLSearchParams(window.location.search);
  var productParam = params.get("product");
  if (productParam) {
    if (productField) productField.value = productParam;
    if (subjectField) subjectField.value = "Product Enquiry";
    if (messageField && !messageField.value) {
      messageField.value = "Hi GEM team, I'd like to enquire about \"" + productParam + "\". ";
    }
    var banner = form.parentElement.querySelector("[data-product-banner]");
    if (banner) {
      banner.hidden = false;
      banner.querySelector("strong").textContent = productParam;
    }
  }

  function setNote(message, type) {
    if (!noteEl) return;
    noteEl.textContent = message;
    noteEl.className = "form-note" + (type ? " is-" + type : "");
  }

  function fieldError(field, message) {
    var errorEl = form.querySelector('[data-error-for="' + field.name + '"]');
    if (errorEl) errorEl.textContent = message || "";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate(data) {
    var valid = true;

    if (!data.name || data.name.trim().length < 2) {
      fieldError(form.elements["name"], "Please enter your full name.");
      valid = false;
    } else {
      fieldError(form.elements["name"], "");
    }

    if (!data.email || !isValidEmail(data.email)) {
      fieldError(form.elements["email"], "Please enter a valid email address.");
      valid = false;
    } else {
      fieldError(form.elements["email"], "");
    }

    if (!data.message || data.message.trim().length < 10) {
      fieldError(form.elements["message"], "Please add a few more details (min. 10 characters).");
      valid = false;
    } else {
      fieldError(form.elements["message"], "");
    }

    return valid;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setNote("", "");

    var formData = new FormData(form);
    var data = Object.fromEntries(formData.entries());
    data.type = data.product_name ? "product_enquiry" : "contact";

    if (!validate(data)) {
      setNote("Please fix the highlighted fields above.", "error");
      return;
    }

    if (!config.SUPABASE_URL || config.SUPABASE_URL.indexOf("YOUR-PROJECT-REF") !== -1) {
      setNote(
        "Form isn't connected yet — add your Supabase project details in js/config.js.",
        "error"
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
    submitBtn.textContent = "Sending…";

    fetch(config.SUPABASE_URL + "/functions/v1/submit-enquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + config.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then(function () {
        setNote(
          "Thank you! Your message has been sent — the GEM team will be in touch shortly.",
          "success"
        );
        form.reset();
        if (productParam && productField) productField.value = productParam;
      })
      .catch(function () {
        setNote(
          "Something went wrong sending your message. Please try again, or reach us directly by phone or email.",
          "error"
        );
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText;
      });
  });
})();