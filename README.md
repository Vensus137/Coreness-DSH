# Coreness for DeepSeek Harness

[![Telegram](https://img.shields.io/badge/Telegram-%40Vensus137-26A5E4?logo=telegram&logoColor=white)](https://t.me/Vensus137)

![The Coreness page: the rail with General, MCP, Qoder and Rate limiter, the MCP section open — one card per server](https://gist.githubusercontent.com/Vensus137/776e4d247aef014e32bceb810fdeae21/raw/410b202cc83345ebaeac891d46d8b23cb58c93c0/hero.png)

Coreness is the product for one DeepSeek Harness profile: a panel in the application's sidebar, whose rail holds the sections for the profile's MCP servers, its Qoder provider, its rate limits and usage.

## Install

*Plugins* → *Add plugin*, in the application's own window, takes the package into the profile the application is running — no profile to name — and the address is:

```
github:Vensus137/Coreness-DSH
```

The install lands in the running profile, and a restart is asked for only where the application cannot apply the change in place. Nothing is built on the way in: the package is plain files, and its manifest declares no Harness version bound. The address is a git repository, so the install reads it with git — a machine without git cannot install it.

<details>
<summary><b>By command line, and updates through the market</b></summary>

`dsh` is the application's own command and not one Windows or macOS comes with: the application puts it on the path from its own menu — **Application → Manage dsh Command…** in the window's title bar on Windows, the same item in the application menu on macOS — and a terminal opened before that act keeps the path it started with. The line then runs as it stands: the desktop application's own profile is `desktop`; another profile is named instead — the web surface's is `web` — and a name that does not stand yet is created:

```
dsh plugin --profile desktop add github:Vensus137/Coreness-DSH
```

Updates go through the application's **Discover** tab: switch *Custom plugin markets* on once (**Plugins → More**), add `https://raw.githubusercontent.com/Vensus137/Coreness-DSH/main/market.json`, and the plugin stands listed with its versions, compared by the application itself: a newer one shows as *Update available*, whose press opens the installed plugin's page. The update itself is taking the plugin off and adding it again with the same address; *Add plugin* over the installed copy is refused. Nothing checks in the background; the address follows the newest release, and a fixed one is named by its tag, `github:Vensus137/Coreness-DSH#<tag>`.

</details>

## What a profile gets

- **The MCP servers, seen and edited** — one card per server: its kind, its address, the environment it needs, and switches whose effect lands in the profile rather than in a copy. A server behind OAuth is signed in from its card.

  ![A close-up of the notes card in the MCP section: its switch flipped on, its tools appearing, and the counter moving from two servers on to three](https://gist.githubusercontent.com/Vensus137/776e4d247aef014e32bceb810fdeae21/raw/410b202cc83345ebaeac891d46d8b23cb58c93c0/mcp-switch.gif)

- **The Qoder models** — the account's own, each with the reasoning levels it accepts and the output budget it allows; the token is entered once, in the Qoder section, and kept by the platform's own store.
- **A limiter that waits instead of refusing** — a call over a declared limit takes its turn in a queue; nothing is limited until a limit is declared.

  ![The Rate limiter section: the window, the longest wait, and a ceiling per model](https://gist.githubusercontent.com/Vensus137/776e4d247aef014e32bceb810fdeae21/raw/410b202cc83345ebaeac891d46d8b23cb58c93c0/rate-limiter.png)

- **The Agent team, on the General page** — how many teammates a session may hold, written through the platform's own editor, and two switches that put the product's paragraph in place of the platform's last team-policy sentence and add the review paragraph after it; the team is the platform's, and every other line stays as it wrote it.

  ![The General page's Agent team card: the teammates ceiling, and the Team prompt and Review pass switches](https://gist.githubusercontent.com/Vensus137/776e4d247aef014e32bceb810fdeae21/raw/410b202cc83345ebaeac891d46d8b23cb58c93c0/general.png)

- **The rules of the tree, in force** — the conventions the product's own tree works by, as one prompt section in the platform's registry: every request of the profile carries them, and no compaction can take them out of the model's sight.

## What lands

The repository is the bundle: behind it stand the packages it names — the panel, the rules, MCP, the OAuth sign-in, the Qoder route, the rate limiter and the team card — each its own plugin, so a profile switches off the ones it does not use on the application's own Plugins page. Nothing is fetched from the product's side; what the page shows is read from the profile and the account it names.

## License

MIT.
