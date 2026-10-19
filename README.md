# Coreness for DeepSeek Harness

**A page, a journal and a brake for a DeepSeek Harness profile.**

Coreness is the product for one DeepSeek Harness profile: a page with the profile's MCP servers, its Qoder provider and its rate limits and usage; the journal of what the profile and its sessions do; and the rules of the tree in force. It installs as it is: the halves the browser loads are plain files, served where they lie — nothing is built, nothing is compiled, and what is installed is what runs.

## ⚡ Install

**The application installs its own plugins.** *Plugins* → *Add plugin* takes a package name, a tarball, a git address or a local path, and the package goes into the profile the application is running — one door for the desktop application and for the web one, and no profile to name:

```
github:Vensus137/Coreness-DSH
```

The same page switches the package off without removing it, and takes it off again.

That address follows the newest release, and what stands published is a release — so the address and the newest release are one thing here. A fixed release is named by its own tag — `…Coreness-DSH#v0.6.2` — and a released tag is never moved: that line gives the same code whenever it is run.

<details>
<summary><b>By command line</b> — for a terminal; nothing above needs it</summary>

The line is ready to run as it stands, because the desktop application's own profile carries that name:

```
dsh plugin --profile desktop add github:Vensus137/Coreness-DSH
```

Another profile is named by its own name instead — the web surface's is `web` — and naming a profile that does not stand yet creates it.

`dsh` is the application's own command and is not one Windows or macOS comes with, so until the application puts it on the path a terminal answers *not recognized*. The application does that from its own menu: in the window's title bar beside the app icon, **Application** → **Manage dsh Command…** — the dialog shows the location it manages, and the same dialog takes the command off the path again. A terminal opened before that act keeps the path it started with, so open a new one afterwards.

</details>

The profile's composition is read when the application starts, so the package becomes live at the next start, and the platform says itself when a change it made needs a restart. Nothing is built on the way in and no permission for install scripts is asked: the package is plain files, and the address is fetched over the network the application already uses rather than by a git client — a machine without git installs it.

### Updates through the market

The application has its own **Discover** tab: it reads a plugin market, and the market is a list you add. Turn
on *Custom plugin markets* once — **Plugins → More** beside *Experimental plugins* — then add this address in
Discover:

```
https://raw.githubusercontent.com/Vensus137/Coreness-DSH/main/market.json
```

The plugin stands listed with its versions, and from then on an update is one press on its card: the
application compares the versions itself, installs the newer one and says when a restart is needed. Nothing
checks in the background and nothing notifies — the market is read when the page is opened.

A profile that mounts a working tree (`file:` dependency) is the development case: the market's install would
replace that mount with the published copy, so a development profile updates by re-mounting instead.

## ✨ What a profile gets

- 🗂 **A page of its own** — the profile's MCP servers as cards, its Qoder provider and its rate limits and usage; the sections stand in the rail, and the version stands beside the name.
- 🔌 **The MCP servers, seen and edited** — one card per server: its kind, its address, the environment it needs, and switches whose effect lands in the profile rather than in a copy.
- 📓 **The journal** — the environment's memory: what changed in the profile and what a participant did, kept as records that carry a kind, an area, a name and an author.
- 🚦 **A limiter that waits instead of refusing** — a call over the limit takes its turn in a queue; nothing is limited as the package ships.
- 🧠 **A route to the Qoder models** — the account's own models, each with the reasoning levels it accepts and the output budget it allows. The account's token is entered once, in the Qoder section, and kept by the platform's own store; no value of it stands in the package. The credits foot reads the balance while the account is reachable.
- 📜 **The rules of its own tree, in force** — one prompt section, registered through the platform's own prompt registry, so a session of the profile carries them in every request and no compaction can take them out of the model's sight.

## 🧩 What it needs

- **DeepSeek Harness.** The version this package was built against is declared in the manifest, and the application compares that declaration with its own before a profile imports a plugin: a mismatch leaves the plugin out and says so, instead of failing quietly later.
- **A Qoder account,** for the Qoder route and the credits foot; the token is entered in the Qoder section and kept by the platform's own store.

## 📦 What lands

Exactly the list the package's manifest names — the bundle and the seven packages, each with its own README beside its code. No part of the workshop they are built in: the contracts, the checks and the notes of this project stay where the work is done.

## 🧭 What it deliberately does not do

- It is not a second door to the platform's own acts: enabling, disabling, installing and removing belong to the application's Plugins page, and this package reports what stands rather than competing with it.
- It does not own the MCP side: the platform owns the servers, the connection and the registry, while this package owns the picture and the form.
- It limits nothing until a limit is declared.

## 📄 License

MIT.
