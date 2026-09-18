/**
 * ComponentMap — the actual component tree of this app, as a nested list
 * (real list markup, not ASCII art). The useLiveFeed seam is marked where
 * data enters: DashboardPage calls the hook and everything below it receives
 * fleet + lastUpdated as props.
 */

import Section from './Section'

interface Node {
  name: string
  note?: string
  /** Marks the useLiveFeed data seam. */
  fed?: boolean
  children?: Node[]
}

const TREE: Node = {
  name: 'App',
  note: 'HashRouter',
  children: [
    {
      name: 'AppShell',
      note: 'top bar, live-feed indicator, footer',
      children: [
        {
          name: 'DashboardPage',
          note: 'calls useLiveFeed — fleet + lastUpdated flow down as props',
          fed: true,
          children: [
            { name: 'FleetPulse', note: 'signature hero; one tick per device', fed: true },
            { name: 'KpiRow', note: 'total / reporting / needs attention / offline', fed: true },
            { name: 'FilterBar', note: 'site, kind, status — composable' },
            { name: 'QueryPanel', note: 'the 8 pre-defined queries', fed: true },
            {
              name: 'DeviceGrid',
              fed: true,
              children: [
                { name: 'DeviceCard', note: 'status as icon + label + colour' },
              ],
            },
            {
              name: 'ChartSection',
              fed: true,
              children: [
                { name: 'UptimeTimeline', note: 'one row per site, 24 h' },
                { name: 'StatusDistribution', note: 'fleet composition by status' },
                { name: 'MetricLine', note: 'fleet health over 24 h' },
              ],
            },
            {
              name: 'DeviceDrawer',
              note: 'single-device history, Esc to close',
              fed: true,
              children: [
                { name: 'Sparkline', note: "one device's metric over 24 h" },
              ],
            },
          ],
        },
        {
          name: 'ArchitecturePage',
          note: 'C4 diagrams, data flow, requirements, ADRs — this page',
        },
      ],
    },
  ],
}

function FeedChip() {
  return (
    <span className="ml-2 inline-block rounded border border-border px-1.5 py-px font-data text-[10px] text-series-1">
      useLiveFeed
    </span>
  )
}

function TreeNode({ node }: { node: Node }) {
  return (
    <li>
      <p className="text-sm">
        <span className="font-data text-text-primary">{node.name}</span>
        {node.note && <span className="text-text-muted"> — {node.note}</span>}
        {node.fed && <FeedChip />}
      </p>
      {node.children && (
        <ul className="ml-2 mt-1 space-y-1 border-l border-gridline pl-4">
          {node.children.map((child) => (
            <TreeNode key={child.name} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function ComponentMap() {
  return (
    <Section
      id="component-map"
      title="Frontend component map"
      intro={
        <>
          The tree of this app as built. Data enters at one seam:{' '}
          <code className="font-data text-xs text-series-1">useLiveFeed</code>, which in the real
          system wraps the Feed Client and in this build wraps the mock generator. That boundary is
          deliberate — swapping the mock for a live WebSocket touches one hook and nothing else.
        </>
      }
    >
      <div className="rounded-md border border-border bg-surface-1 p-4">
        <ul className="space-y-1">
          <TreeNode node={TREE} />
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-xs text-text-muted">
          <span className="mr-2 inline-block rounded border border-border px-1.5 py-px font-data text-[10px] text-series-1">
            useLiveFeed
          </span>
          marks every component that renders feed data.
        </p>
      </div>
    </Section>
  )
}
