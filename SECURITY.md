# Security Policy

ICOR for Life - INKLINE is an Obsidian **theme**. It is a single CSS file. It ships no
JavaScript, makes no network requests, and stores no credentials. That means its
security surface is very small, and this file says so plainly rather than implying
a risk the theme does not carry. It is not zero, so here is how to reach us.

## Reporting a vulnerability

**Please do not open a public GitHub issue for a security problem.**

Two channels, in order of preference:

1. **GitHub private security advisory** (preferred). Go to the
   [Security tab](https://github.com/myICOR/icor-for-life-inkline/security/advisories/new)
   of this repository and open a draft advisory. This keeps the report private
   between you and the maintainer until a fix ships.
2. **Email** `support@myicor.com` with `SECURITY` and `inkline` in the subject line.
   This is a monitored mailbox.

A useful report contains:

- The theme version (see `manifest.json`, or Settings, Appearance).
- Your Obsidian version and operating system.
- What an attacker can do, and what they need in order to do it.
- Steps to reproduce, ideally against a throwaway vault, with the selector or
  note content that triggers the issue.

## What to expect

This project is maintained by one person, so these are timelines we can actually
keep rather than ones that sound good:

| Stage | Target |
| --- | --- |
| We acknowledge your report | within 5 business days |
| We tell you whether we agree it is a vulnerability, and how severe | within 10 business days |
| We ship a fix for a confirmed critical or high issue | we aim for 30 days |
| We ask you to hold public disclosure until | a fix ships, or 90 days from your report, whichever comes first |

If a deadline is going to slip we will tell you before it slips, not after. If you
do not hear from us within 10 business days, please chase us: assume the message
got lost rather than ignored.

## Supported versions

**Only the most recent release is supported.** This project has one branch (`main`)
and no long-term-support line. There are no backports to older versions and no
security patches for anything but the current release. If you are running an older
version, the fix is to update.

We are not going to publish a version-support table we would not honour.

## Scope: what this theme actually touches

INKLINE is styling and nothing else. Measured against the shipped `theme.css` of
the current release:

- **No JavaScript.** The theme is `theme.css` plus `manifest.json`. There is no
  `main.js` and no executable code of any kind in this repository.
- **No network access.** `theme.css` contains zero `@import` statements and zero
  `url()` references to a remote host. No web font, image, stylesheet or script is
  fetched from anywhere at load time. Everything the theme needs is in the file.
- **No credentials, no telemetry, no analytics.** Nothing is stored and nothing is
  sent.
- **The source is what ships.** `theme.css` is the source. There is no build step
  to trust and nothing is bundled or minified away, so you can read exactly what
  runs.

**In scope, and we want to hear about it:**

- Any `@import`, `url()`, or other construct that causes a request to leave the
  machine. Given the above, any outbound connection is by definition unexpected.
- A CSS rule that hides, spoofs or reorders a security-relevant part of the
  Obsidian interface: a permission or trust prompt, an "external link" indicator,
  a plugin-install confirmation, or a file path being displayed to the user.
  Making a destructive action look safe, or an untrusted thing look trusted, is a
  real finding and we will treat it as one.
- CSS that can be steered by note content to exfiltrate information, for example
  an attribute selector plus a remote resource used as a side channel.
- Selectors that render a genuine warning or error state invisible.

## Out of scope

These are not vulnerabilities and we will close them as such:

- Bugs in Obsidian itself. Report those to
  [Obsidian](https://github.com/obsidianmd/obsidian-releases/issues).
- Interactions with third-party plugins, or a plugin's controls looking wrong
  under this theme. Themes and plugins overlap constantly and this is ordinary
  breakage, not a security issue. Please report it as a normal issue so we can
  look at compatibility.
- Any behaviour of a plugin you have installed. A theme cannot make a plugin do
  something it does not already do.
- Anyone with filesystem access to your vault being able to read your notes. A
  stylesheet is not the control that failed.
- Contrast, spacing, colour and readability problems. Those are ordinary issues
  and very welcome as such, just not through this channel. Accessibility
  regressions are taken seriously; they simply go through normal issues.
- Missing hardening that has no demonstrated impact, or the output of an automated
  scanner with no working proof of concept.
- Social engineering, physical access, or attacks that require the user to
  already be running attacker-controlled code.

## Good-faith research

We will not pursue or support legal action against anyone who reports a
vulnerability to us in good faith, follows this policy, gives us reasonable time to
fix the issue before disclosure, and does not access, modify or destroy data that
is not their own. Test against your own vault.

There is no bug bounty. We are a small team and cannot pay for reports. We will
credit you by name and link in the release notes and the advisory unless you would
rather stay anonymous.

## Credit

Thank you for taking the time. A report that arrives privately and with a
reproduction is worth a great deal more than the effort it costs you to write it.
