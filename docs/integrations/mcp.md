---
icon: lucide/bot
---

# MCP server

Voltius can act as an [MCP](https://modelcontextprotocol.io) server, so an AI agent running on your computer — Claude Code, Claude Desktop, Cursor, Cline, Windsurf, VS Code with Copilot, OpenCode — can use your saved hosts directly. The agent opens sessions, runs commands, reads and writes files over SFTP, and creates or deletes connections, keys and identities, using the credentials already in your vault. You never paste a private key into a chat window.

It is **off by default** and lives entirely on your machine.

!!! warning "Read the security model before you enable this"
    Turning this on grants any process running as you that can open the socket full command and file access to **every host in your vault and to this computer**. Voltius does not prompt per call — see [What you are granting](#what-you-are-granting).

## Enabling it

**Settings → Integrations → MCP.** Flip the toggle; the row shows **Running** once the socket is up. Turning it off closes the socket and disconnects any attached client.

Enabling the server is not enough on its own — your client also has to be told Voltius exists.

## Connecting a client

### Quick setup

The **Quick setup** button runs [`add-mcp`](https://www.npmjs.com/package/add-mcp), which detects the AI agents installed on this computer and registers Voltius with all of them, leaving your other MCP servers untouched. It needs Node.js. The command it runs is:

```bash
npx add-mcp@2 '/path/to/voltius' --args mcp -n voltius -g
```

`add-mcp` asks for confirmation and shows which agents it will configure before writing anything. That prompt is deliberate: these are config files on a machine where Voltius holds your SSH credentials.

### Manual setup

No Node.js, or a client `add-mcp` doesn't know about? **Manual setup** in the same panel reveals a copyable snippet per client, already filled in with this installation's executable path.

=== "Claude Code"

    ```bash
    claude mcp add voltius -- '/path/to/voltius' mcp
    ```

=== "Claude Desktop / Cursor / Cline / Windsurf"

    Add to `claude_desktop_config.json` or `.cursor/mcp.json`:

    ```json
    {
      "mcpServers": {
        "voltius": { "command": "/path/to/voltius", "args": ["mcp"] }
      }
    }
    ```

=== "VS Code / GitHub Copilot"

    Add to `.vscode/mcp.json`:

    ```json
    {
      "servers": {
        "voltius": { "type": "stdio", "command": "/path/to/voltius", "args": ["mcp"] }
      }
    }
    ```

    VS Code uses `servers`, not `mcpServers` — pasting a Cursor-style block here silently loads nothing.

=== "OpenCode"

    Add to `opencode.json` (project) or `~/.config/opencode/opencode.json` (global):

    ```json
    {
      "mcp": {
        "voltius": { "type": "local", "command": ["/path/to/voltius", "mcp"], "enabled": true }
      }
    }
    ```

Every client speaks stdio to `voltius mcp`, a thin shim that forwards to the running app. **Voltius has to be open** — the shim is not a headless server, and a client that starts while the app is closed gets no tools.

## What the agent can do

41 tools, grouped by what they touch. Names are exactly what the agent sees.

| Group | Tools |
| --- | --- |
| **Connections** | `list_connections` · `connection_get` · `connection_create` · `connection_update` · `connection_delete` · `connection_bulk_import` |
| **Keychain** | `key_list` · `key_create` · `key_delete` · `identity_list` · `identity_create` · `identity_delete` |
| **Sessions** | `list_sessions` · `open_session` · `run_command` · `read_terminal` · `close_session` |
| **Files** | `list_files` · `stat_file` · `read_file` · `write_file` · `make_dir` · `rename_path` · `delete_path` · `transfer_file` |
| **Audit** | `audit_query` |

Sessions can target a saved SSH host or **this computer's own shell**. `transfer_file` moves files between any two ends the app can reach, including host to host.

A team-vault object refuses changes the same way the UI does: an agent calling `connection_update` on a connection owned by a team vault gets an error, and nothing is written.

### Tools your plugins add

Installed plugins can contribute their own tools, so the agent grows with the app. The four bundled plugins add 15:

| Plugin | Tools |
| --- | --- |
| **Docker** | `docker__container_list` · `docker__container_action` · `docker__container_logs` · `docker__image_list` · `docker__volume_list` · `docker__network_list` · `docker__stack_list` |
| **Proxmox** | `proxmox__lxc_list` · `proxmox__lxc_action` · `proxmox__snapshot_list` · `proxmox__snapshot_create` · `proxmox__snapshot_rollback` |
| **Process manager** | `process-manager__process_list` · `process-manager__process_kill` |
| **System monitoring** | `monitoring__metrics_snapshot` |

**Settings → Integrations → Plugin tools exposed to clients** lists every plugin that contributes tools, with a per-plugin toggle. Turning one off removes its tools from the list *and* refuses calls to them — an agent that already had the list is told immediately that the tool list changed. Third-party plugins must hold the danger-gated `mcp:contribute` permission, which you grant explicitly at install.

## What you are granting

This is the part worth reading twice.

- **Approval happens in the client, not in Voltius.** Claude Code and friends have their own approval UI; that is the layer that asks before a command runs. Voltius performs no per-call check by construction — it is a tool provider, not a second gate.
- **The reach is your whole vault, plus this computer.** Every saved host, every key, every identity, and a local shell. Deletion verbs are included and are not undoable.
- **Anything running as you that can open the socket has that reach.** The socket is protected by the operating system's own access control, not by a token Voltius issues.

Access is scoped by the OS:

- **Linux and macOS** — a Unix socket at `<config>/voltius/mcp/mcp.sock`, mode `0600`, inside a `0700` directory.
- **Windows** — a named pipe at `\\.\pipe\voltius-mcp-<username>`, with a DACL granting only your own user SID, created with `FILE_FLAG_FIRST_PIPE_INSTANCE` so a squatted pipe name fails loudly instead of quietly handing your agent to another process.

Nothing here crosses the network, and the Voltius server is not involved.

### The audit trail

Voltius writes an audit row for calls that change something — the host writes it, not the plugin, so a plugin cannot forget to. Rows record which tool ran, which plugin contributed it, and which connection it touched. **Argument values are not recorded**: no command text, no file paths, no snapshot names. Team-vault activity lands in that vault's [audit log](../teams/audit-logs.md); the rest stays local. An agent can read its own trail with `audit_query`.

## Troubleshooting

**The client lists no tools.** The server must be running (Settings → Integrations shows **Running**) *and* the app must be open. Restart the client after enabling — most clients read the tool list once at startup.

**VS Code loads nothing at all.** Check you used `servers` and not `mcpServers`.

**A plugin's tools are missing.** Check the per-plugin toggle in **Plugin tools exposed to clients**, and that the plugin is enabled in **Settings → Plugins**.

**A tool exists but every call fails.** The agent may be holding a session id from a previous run. Sessions are owned by the client that opened them, and a client that reconnects gets a new identity, so it can no longer close the sessions its previous incarnation opened.
