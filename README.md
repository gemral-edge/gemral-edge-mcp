# Gemral Edge MCP server

Remote MCP server for Gemral Edge: point-in-time U.S. public-record data (federal contracts, congressional and insider trades, lobbying, regulatory publications) and AI-infrastructure physical data, for AI assistants.

This repository holds the public metadata for the server (`server.json` for the official MCP Registry) and connection instructions. The server itself is hosted; there is no package to install.

- Every record is tied to the company and ticker that were valid on the day it became public.
- Publication lags are applied, so the data can be joined without look-ahead.
- Each record type ships only after a sampled accuracy check against the original public documents (95% minimum).
- Delisted and acquired companies stay in the history under the ticker they had at the time.
- Data comes only from public sources and contains no material non-public information.
- Delivered as Parquet files, a REST API and an MCP server for AI assistants.
- For AI-infrastructure companies we also track data-center sites, air permits, permitted backup-generator MW, substations, grid demand, equipment imports, capex and satellite measurements.

Known limits worth reading before you rely on the data:

- Roughly half of events on delisted tickers have historical prices; results on delisted names can be biased upward by survivorship.
- Permitted backup-generator MW is an upper bound on on-site backup capacity, not IT load; we do not convert it.
- Imports are industry context by product code and origin country, not company-level shipments.

## Connect

- **Server URL (streamable HTTP):** `https://mcp.gemral.com/mcp`
- **Auth:** OAuth (clients that support MCP authorization discover it automatically) or an API key sent as `Authorization: Bearer <key>`.
- **Keys and plans:** https://www.gemral.com/edge/pricing · questions: support@gemral.com

Claude (custom connector) or ChatGPT (connector): add the server URL above and sign in when prompted.

Cursor, Windsurf and other clients that take a JSON config:

```json
{
  "mcpServers": {
    "gemral-edge": {
      "url": "https://mcp.gemral.com/mcp",
      "headers": { "Authorization": "Bearer YOUR_GEMRAL_EDGE_KEY" }
    }
  }
}
```

## Tools

37 tools, as returned by the server's `tools/list`:

- `get_company_exposure`
- `get_event_expected_impact`
- `get_contract_beneficiaries`
- `get_policy_affected_companies`
- `get_signal_historical_outcomes`
- `screen_convergence`
- `explain_score`
- `get_top_signals`
- `get_leaderboard`
- `get_track_record`
- `get_forecast`
- `get_ticker_intelligence`
- `get_actor_profile`
- `get_crypto_funding_extremes`
- `get_onchain_whale_flows`
- `audit_cluster_insider_buying`
- `get_committee_conflict_map`
- `scan_crypto_patterns`
- `get_physical_footprint`
- `search_management_promises`
- `get_open_promises`
- `get_overdue_promises`
- `get_management_credibility`
- `compare_management_teams`
- `get_claim_history`
- `verify_claim`
- `get_language_drift`
- `get_guidance_accuracy`
- `search_accountability_people`
- `get_upcoming_catalysts`
- `get_breakout_watch`
- `get_precursor_signals`
- `get_event_impact_preview`
- `get_policy_intelligence_feed`
- `get_beneficiary_tickers`
- `get_event_countdown`
- `verify_event_status`

## Documentation

- Data due-diligence questionnaire (methods, coverage, known limits): https://www.gemral.com/edge-ddq.md
- API quickstart: https://www.gemral.com/edge-api-quickstart.md
- Data license: https://www.gemral.com/edge-api-license.md

Fields derived from map data and satellite imagery carry these attributions: "© OpenStreetMap contributors" and "Contains modified Copernicus Sentinel data 2023-2026".

Output is informational and is not investment advice.

## License

The files in this repository (README and metadata) are MIT licensed. Data returned by the server is covered by the Gemral Edge data license linked above.
