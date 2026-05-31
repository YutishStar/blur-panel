/* Cracked Hackerhouse — PostHog analytics
 *
 * Loaded in the <head> of every page. With autocapture (on by default) this
 * tracks, with zero extra code:
 *   - pageviews        → how many people are viewing, which pages
 *   - unique visitors  → how many distinct people / sessions
 *   - clicks           → every button + link click on the site
 *
 * The key below is a PUBLIC, write-only project key (phc_...). It is meant to
 * live in client-side code and is safe to commit.
 *
 * To get it: us.posthog.com → create a new project "Cracked Hackerhouse" →
 * Settings → Project → "Project API key".
 */
(function () {
  var POSTHOG_KEY = "phc_rPE9byAtBw68rgu9PHMFtBfoBo5p9anmbHcTqqDFfSQi"; // public, write-only project key — project "Cracked"
  var POSTHOG_HOST = "https://us.i.posthog.com";

  if (!POSTHOG_KEY || POSTHOG_KEY.indexOf("phc_") !== 0) {
    // Key not set yet — stay silent rather than firing at a dead endpoint.
    return;
  }

  // PostHog web snippet (async loader)
  !(function (t, e) {
    var o, n, p, r;
    e.__SV ||
      ((window.posthog = e),
      (e._i = []),
      (e.init = function (i, s, a) {
        function g(t, e) {
          var o = e.split(".");
          2 == o.length && ((t = t[o[0]]), (e = o[1])),
            (t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            });
        }
        ((p = t.createElement("script")).type = "text/javascript"),
          (p.crossOrigin = "anonymous"),
          (p.async = !0),
          (p.src =
            s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
            "/static/array.js"),
          (o = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, o);
        var u = e;
        for (
          void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
            u.people = u.people || [],
            u.toString = function (t) {
              var e = "posthog";
              return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
            },
            u.people.toString = function () {
              return u.toString(1) + ".people (stub)";
            },
            r =
              "init me ws ys ps bs capture je Di ks register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(
                " "
              ),
            n = 0;
          n < r.length;
          n++
        )
          g(u, r[n]);
        e._i.push([i, s, a]);
      }),
      (e.__SV = 1));
  })(document, window.posthog || []);

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    defaults: "2025-05-24",
  });

  // ---- Named custom events ----------------------------------------------
  // Autocapture already records every click generically; these add a few
  // clean, named events for the interactions that actually matter, so they
  // surface nicely on the /analytics dashboard.
  function track(el) {
    if (!el || !el.closest) return;

    // "apply now" — the conversion that matters most
    if (el.closest('.apply__btn, a[href*="#apply"], a[href*="apply"]')) {
      posthog.capture("apply_click", { location: location.pathname });
      return;
    }
    // primary nav pills
    var pill = el.closest(".nav__pill, .nav__wordmark-link");
    if (pill) {
      posthog.capture("nav_click", { label: (pill.textContent || "").trim() });
      return;
    }
    // social / footer outbound links
    var social = el.closest(".foot__icon, .mobile-gate__icon, .foot__link");
    if (social) {
      posthog.capture("link_click", {
        label: (social.getAttribute("aria-label") || social.textContent || "").trim(),
        href: social.getAttribute("href") || "",
      });
    }
  }

  document.addEventListener(
    "click",
    function (e) {
      try {
        track(e.target);
      } catch (_) {}
    },
    true
  );
})();
