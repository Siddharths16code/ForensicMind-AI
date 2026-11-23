
import { useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
} from "@xyflow/react";

type EventType =
  | "login"
  | "file_modified"
  | "usb_connected"
  | "file_transfer";

type EvidenceEvent = {
  id: number;
  event_type: EventType;
  timestamp: number;
};

type EvidenceGraphProps = {
  events: EvidenceEvent[];
};

const eventInfo: Record<
  EventType,
  { label: string; description: string; color: string }
> = {
  login: {
    label: "User Login",
    description: "Authentication activity",
    color: "#927cff",
  },
  file_modified: {
    label: "File Modified",
    description: "File system activity",
    color: "#43d6b0",
  },
  usb_connected: {
    label: "USB Connected",
    description: "External device activity",
    color: "#f0ad69",
  },
  file_transfer: {
    label: "File Transfer",
    description: "Data movement activity",
    color: "#ff7185",
  },
};

export default function EvidenceGraph({ events }: EvidenceGraphProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.timestamp - b.timestamp),
    [events]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedEvent, setSelectedEvent] = useState<EvidenceEvent | null>(
    null
  );

  useEffect(() => {
    const newNodes: Node[] = sortedEvents.map((event, index) => {
      const info = eventInfo[event.event_type];

      return {
        id: String(event.id),
        position: {
          x: index * 270,
          y: index % 2 === 0 ? 80 : 230,
        },
        data: {
          label: (
            <div style={{ textAlign: "left", minWidth: 150 }}>
              <div
                style={{
                  color: info.color,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  marginBottom: 9,
                }}
              >
                EVIDENCE #{index + 1}
              </div>
              <div
                style={{
                  color: "#f3f4fa",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 7,
                }}
              >
                {info.label}
              </div>
              <div style={{ color: "#a4adbf", fontSize: 11 }}>
                T+{event.timestamp}
              </div>
            </div>
          ),
        },
        style: {
          background: "#141c2a",
          border: `1px solid ${info.color}`,
          borderRadius: 12,
          padding: 15,
          width: 205,
          boxShadow: `0 0 20px ${info.color}18`,
        },
      };
    });

    const newEdges: Edge[] = sortedEvents.slice(0, -1).map((event, index) => ({
      id: `edge-${event.id}-${sortedEvents[index + 1].id}`,
      source: String(event.id),
      target: String(sortedEvents[index + 1].id),
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#927cff",
      },
      style: {
        stroke: "#927cff",
        strokeWidth: 2,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedEvent(null);
  }, [sortedEvents, setNodes, setEdges]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              color: "#927cff",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.5,
            }}
          >
            VISUAL EVIDENCE ANALYSIS
          </div>
          <h3 style={{ color: "#f3f4fa", margin: "6px 0" }}>
            Evidence Relationship Graph
          </h3>
          <p style={{ color: "#929db1", fontSize: 12, margin: 0 }}>
            Select any node to inspect its evidence details.
          </p>
        </div>

        <div
          style={{
            color: "#a4adbf",
            fontSize: 12,
            background: "#101622",
            border: "1px solid #273247",
            borderRadius: 8,
            padding: "9px 12px",
          }}
        >
          {events.length} evidence nodes · {edges.length} connections
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div
          style={{
            minHeight: 250,
            display: "grid",
            placeItems: "center",
            color: "#929db1",
            background: "#101622",
            border: "1px dashed #344057",
            borderRadius: 12,
          }}
        >
          Add evidence events to generate the relationship graph.
        </div>
      ) : (
        <div
          style={{
            height: 470,
            width: "100%",
            overflow: "hidden",
            border: "1px solid #273247",
            borderRadius: 12,
            background: "#0c101a",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => {
              const found = sortedEvents.find(
                (event) => String(event.id) === node.id
              );
              setSelectedEvent(found ?? null);
            }}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.25}
            maxZoom={1.5}
            attributionPosition="bottom-left"
          >
            <Background
              color="#293449"
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
            />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const event = sortedEvents.find(
                  (item) => String(item.id) === node.id
                );
                return event ? eventInfo[event.event_type].color : "#927cff";
              }}
              maskColor="rgba(12,16,26,0.75)"
              style={{ background: "#141c2a" }}
            />
          </ReactFlow>
        </div>
      )}

      {selectedEvent && (
        <div
          style={{
            marginTop: 16,
            padding: 18,
            background: "#141c2a",
            border: `1px solid ${eventInfo[selectedEvent.event_type].color}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              color: eventInfo[selectedEvent.event_type].color,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.3,
              marginBottom: 8,
            }}
          >
            SELECTED EVIDENCE
          </div>
          <h4 style={{ color: "#f3f4fa", margin: "0 0 8px" }}>
            {eventInfo[selectedEvent.event_type].label}
          </h4>
          <p style={{ color: "#a4adbf", fontSize: 13, margin: "0 0 8px" }}>
            {eventInfo[selectedEvent.event_type].description}
          </p>
          <div style={{ color: "#d5dbea", fontSize: 12 }}>
            Evidence ID: {selectedEvent.id} · Timestamp: T+
            {selectedEvent.timestamp}
          </div>
        </div>
      )}

      <p
        style={{
          color: "#929db1",
          fontSize: 11,
          lineHeight: 1.6,
          marginTop: 14,
        }}
      >
        Note: Connections represent chronological ordering in the supplied
        events. They do not independently prove causation, data theft, or
        attribution to a person.
      </p>
    </div>
  );
}
