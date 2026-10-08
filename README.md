# Chợ Tốt A2UI demo

Local agent-driven listing demo using Google A2UI **v0.9** envelopes and Codex through CLIProxyAPI as the streaming inference provider. Searches and details use the live public Chợ Tốt gateway API, adapted from the provided adlisting repository. No purchases or seller messaging.

## Run

Requires Node 22+ and a running CLIProxyAPI with a Codex route. By default, the server reads the base URL, token, and model from `~/.ccs/codex.settings.json`; secrets never go to the browser.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Override settings with `CCS_SETTINGS_PATH`, or supply `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` through your environment. `npm test` runs protocol, filter, and stream parser checks.

`node test/browser.mjs` runs a live Codex search → filter → detail browser check using installed Google Chrome, checks mobile overflow, and writes screenshots to `test-results/`. It consumes inference usage.

`node test/streaming-live.mjs` verifies that the first listing card renders while inference is still streaming, then checks the completed results and records timing.

`node test/live-scenarios.mjs` checks real private/video search, API-ordered comparisons, empty results, auto-scroll, the historical walkthrough, all nine presentation slides, and mobile layout. Live scripts require the proxy, listing API, and installed Google Chrome.

## Demo script

Use **Present ↗** in the navigation bar for fullscreen, larger type, and nine slides: four A2UI introductions followed by five A2UI / MCP Apps comparisons. Keyboard: `P` toggles presentation mode, arrow keys navigate slides, and `Esc` exits. Open `http://localhost:3000/?present=1` to start in presentation layout without requiring fullscreen. Normal mode retains all introduction content, the full comparison, and source links.

1. Ask “Tìm iPhone dưới 15 triệu ở TP.HCM”. Watch createSurface, updateDataModel, and updateComponents in the inspector.
2. Click Cá nhân or Có video. The renderer sends an A2UI action with the current data model in transport metadata; Codex returns an updated surface.
3. Open a listing, then return. Ask to compare two laptops. The agent switches the component tree to details or comparison.

## Architecture

The **Trace explained** tab walks through the recorded laptop-comparison response at 3.7s, 7.4s, 10.2s, and 13.3s. Each stage shows the exact envelope, accumulated state, and a schematic of visible UI. This recording predates the real API integration and remains a fixed educational example. The live demo now resolves intent, calls the listing service, and passes real records to Codex and the renderer. The inspector logs backend request/response events separately from A2UI envelopes.

Browser → local HTTP endpoint → Codex intent extraction → Chợ Tốt listing API → Codex streaming UI composition → complete A2UI envelopes → validation → NDJSON → progressive catalog renderer.

The following diagram shows the current live integration. Listing requests run on the server; the browser receives normalized records through the A2UI data model.

```mermaid
sequenceDiagram
    actor User
    participant Client as Client · Browser
    participant Backend as Backend · Local server
    participant LLM as LLM · Codex via CLIProxyAPI
    participant Ads as Chợ Tốt · Adlisting API

    Client->>Backend: Load component catalog
    Backend-->>Client: Supported catalog, no preloaded live ads

    User->>Client: Compare the two cheapest laptops
    Client->>Backend: Request + current UI state
    Backend->>LLM: Resolve search intent
    LLM-->>Backend: Validated query and view mode
    Backend->>Ads: GET /v1/public/ad-listing with query
    Ads-->>Backend: Actual ad records and total
    Backend->>LLM: Prompt + catalog + actual ad records

    loop While LLM generates
        LLM-->>Backend: Stream text chunks
        Note over Backend: Assemble a complete A2UI envelope<br/>Validate schema and listing IDs
        Backend-->>Client: Stream envelope with ads in the data model
        Note over Client: Update accumulated state<br/>Render immediately
    end

    Backend-->>Client: Completion marker
    Note over Backend,Client: Same HTTP response stays open<br/>until streaming finishes

    User->>Client: Click a filter
    Client->>Backend: Action + current data model
    Backend->>Ads: Search again with updated filter
    Ads-->>Backend: Updated records
    Backend->>LLM: Action + state + returned records
    LLM-->>Backend: Stream new A2UI updates
    Backend-->>Client: Validate and forward updates
    Client-->>User: Updated interface
```

The server uses `/v1/public/ad-listing` for search and `/v2/public/ad-listing/{list_id}` for details, with public `ct-platform: web` headers. It maps phones/laptops/motorbikes to `cg=5010/5030/2020`, private/pro sellers to `f=p/c`, video to `contain_videos=1`, price sorting to `sp=1`, and Hồ Chí Minh to `region_v2=13000`. Search is scoped to Hồ Chí Minh by default or nationwide when requested; other locations currently return a clear unsupported-query error. The optional `ADLISTING_BASE_URL` overrides the gateway origin for testing.

Searches return up to six ads (three candidates for comparisons). Price-sorted requests exclude zero-price records, but backend-listed prices can still be implausible; they are not verified offers. The model composes from the returned API page, not the entire market. There is no sample-data fallback. The old sample inventory is served only to the historical walkthrough at `/api/trace-fixtures`.

Codex produces one protocol envelope per line. Each envelope is validated against the vendored official v0.9 server schema and the demo catalog before delivery. The server validates the query before calling the API, attaches authoritative returned records to `updateDataModel.value.ads`, and rejects any UI component referencing an ID absent from that response. The frontend implements a bounded renderer, not the full basic catalog. Custom components: Column, Text, FilterBar, ListingCard, AdDetail, Comparison. The catalog ID is `urn:chotot:a2ui:demo:0.9`.

Rendering starts before inference completes: the agent emits the surface, data model, layout, and individual card updates in separate envelopes. The inspector shows envelope count, time to first envelope, and total duration. JSON is buffered only until a complete line is available, never rendered from partial JSON. Each turn sends the current data model. Errors are surfaced without mocked responses; if a stream fails after valid updates, the partial UI stays visible with an error. A completion marker prevents truncated streams from being reported as successful.

The demo makes inference requests and read-only public listing/detail requests, and exposes no execution tools. Credentials remain server-side. The server binds to loopback, limits concurrent requests to two, and cancels upstream requests when clients disconnect. Inference calls have a 120-second timeout; listing calls have a 15-second timeout. Returned records are whitelisted so phone numbers, raw account identifiers, and precise addresses are not sent to the browser or model.

## Source adaptation

Source reference: `/Users/hiraism/workspace/fe/ct-web-uni-adlisting`.

- `packages/helpers/filter/filterTagParams.js` is copied verbatim to `public/filterTagParams.js`: account types `p`/`c`, canonical serialization, video toggles, reset page to 1, and preservation of other filter values.
- `apps/ct-web-c2c-adlisting/src/components/ListAds/AdsCard/NormalAdsCard/index.tsx`: adapted card hierarchy, subject, price, thumbnail, seller type, location, and listing interaction.
- `.../AdsCard/LocationLabel.tsx` and `packages/components/OrderFilter/OrderFilter.js`: location presentation and private/video/price filters inform the local components.

The production React components themselves are not directly imported: they depend on Next.js routing, Redux, Linaria, private Chợ Tốt packages, and tracking infrastructure. The demo adapts their UI contract to standalone DOM components. Inventory fields retain Chợ Tốt naming (`list_id`, `subject`, `region_name`, `area_name`). Illustrations are placeholders.

Official schemas in `schemas/` originate from https://github.com/a2ui-project/a2ui/tree/main/specification/v0_9/json (Apache-2.0). Protocol docs: https://a2ui.org/. Codex headless docs: https://developers.openai.com/codex/noninteractive.
