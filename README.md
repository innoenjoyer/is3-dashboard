# Is3 — IoT device status dashboard

Coursework for **Computer Systems and Networks**, Innopolis University, Master SNE.
Lab 2, Part B (Task 3) — architecture design for the Is3 startup's dashboard system.

A near-real-time dashboard showing the status of a customer's registered IoT devices
on one screen. Read-only by requirement: the customer sees device status, runs
pre-defined queries, and changes nothing.

## Layout

```
Is3-Project/
├── docs/                  architecture document (Task 3 deliverables)
│   ├── 01-requirements.md     3.1  functional + non-functional
│   ├── 02-components.md       3.2  component map
│   ├── 03-tech-stack.md       3.3  technology choices, with rejected alternatives
│   ├── 04-architecture.md     3.4  C4 views, process view, deployment
│   └── adr/                        architecture decision records
├── frontend/              the dashboard itself — React + TypeScript + Vite
└── orchestration/         build brief, task plan and build logs
    ├── BRIEF.md               design + tech source of truth
    ├── TASKS.md               task breakdown with acceptance criteria
    └── logs/                  per-task build logs
```

## Running it

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
```

There is no backend. `frontend/src/data/` simulates the device feed from a fixed
seed, so the fleet is identical on every run. The boundary is `useLiveFeed` — in a
real deployment that hook wraps an SSE connection instead of the generator, and no
component above it changes.

## Design notes

The visual direction, colour tokens, typography and chart rules are specified in
`orchestration/BRIEF.md` and are binding. Two rules are worth repeating because they
are accessibility requirements rather than preferences:

- **Status is never colour alone.** Every status indicator is icon + text label +
  colour, all three. Several of our status colours sit close together for
  colour-blind viewers, so colour carries none of the meaning by itself.
- **No dual-axis charts, ever.** Two measures of different scale become two charts.

The chart palette was validated against the dashboard surface for lightness band,
chroma floor, colour-vision-deficiency separation and contrast before any chart code
was written.
