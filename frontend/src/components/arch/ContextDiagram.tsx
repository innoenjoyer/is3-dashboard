/**
 * C4 level 1 — context view. Faithful to docs/04-architecture.md: devices
 * push status in, the technician receives device status, sales onboards
 * customers. What is absent matters most: no arrow runs from the technician
 * to the devices — there is no control path, by requirement.
 */

import { Arrow, Boundary, DBox, DiagramFrame, DLabel } from './svg'

export default function ContextDiagram() {
  return (
    <DiagramFrame
      title="Context view (C4 level 1)"
      description="IoT devices in the field send status messages to the Is3 platform. The platform shows device status to the technician. The sales team onboards customers and registers devices. No arrow runs from the technician back to the devices."
      width={760}
      height={352}
    >
      <Boundary x={330} y={88} w={330} h={160} label="Is3 platform" />
      {/* The platform core is deliberately empty at this level — level 2 opens it. */}
      <text
        x={495}
        y={168}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-text-primary font-sans text-[13px] font-medium"
      >
        Is3 platform
      </text>
      <text
        x={495}
        y={188}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-text-muted font-data text-[10px]"
      >
        this system
      </text>

      <DBox x={40} y={40} w={190} h={62} label="IoT devices" sub="in the field" />
      <DBox x={40} y={140} w={190} h={62} label="Technician" sub="the customer" />
      <DBox x={40} y={240} w={190} h={62} label="Sales team" sub="internal" />

      {/* devices → platform */}
      <Arrow x1={230} y1={71} x2={330} y2={130} />
      <DLabel x={252} y={84} lines={['status messages']} anchor="start" mono />

      {/* platform → technician: status flows out, never back */}
      <Arrow x1={330} y1={190} x2={230} y2={171} />
      <DLabel x={252} y={196} lines={['device status']} anchor="start" mono />

      {/* sales → platform */}
      <Arrow x1={230} y1={271} x2={352} y2={248} />
      <DLabel x={238} y={296} lines={['onboards customers,', 'registers devices']} anchor="start" />

      <DLabel
        x={380}
        y={332}
        lines={[
          'Note what is absent: no arrow runs from the technician to the devices.',
          'There is no control path, by requirement.',
        ]}
      />
    </DiagramFrame>
  )
}
